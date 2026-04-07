/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Shared helpers for Web UI power-control functional tests.
 *
 * Consumed by:
 *   cypress/e2e/integration/power-control/sleep-ui.spec.ts
 *   cypress/e2e/integration/power-control/hibernate-ui.spec.ts
 *   cypress/e2e/integration/power-control/soft-off-ui.spec.ts
 *
 * Provides:
 *   - URL accessors          (webUiBaseUrl, mpsBaseUrl, mpsAuthBaseUrl)
 *   - Auth helpers           (authHeaders)
 *   - Power icon helpers     (waitForPowerIconColor, assertPowerIconColor,
 *                             refreshAndAssertPowerIconColor)
 *   - API helpers            (ensureDevicePoweredOn)
 *   - Setup helpers          (setupAuthAndGuid)
 *   - UI navigation helpers  (loginToWebUi, navigateToDevicePage,
 *                             openPowerOptionsMenu)
 */

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { PowerActions, PowerStateValues, PowerStateLabels } from 'cypress/e2e/fixtures/api/power'

// ─── Shared test context ──────────────────────────────────────────────────────
// Each spec creates one instance and passes it to state-dependent helpers.
// Using an object (not bare variables) lets extracted functions mutate the
// token/guid fields that are assigned during before() and read in the tests.
export interface UiTestContext {
  token: string
  resolvedDeviceGuid: string
}

// ─── URL accessors ────────────────────────────────────────────────────────────

export const webUiBaseUrl = (): string => ((Cypress.env('BASEURL') as string) ?? '').replace(/\/$/, '')

export const mpsBaseUrl = (): string => Cypress.env('MPS_BASEURL') as string

export const mpsAuthBaseUrl = (): string => (Cypress.env('MPS_AUTH_BASEURL') as string | undefined) ?? mpsBaseUrl()

// ─── Auth headers helper ──────────────────────────────────────────────────────

export const authHeaders = (ctx: UiTestContext): Record<string, string> => ({ Authorization: `Bearer ${ctx.token}` })

// ─── waitForPowerIconColor ────────────────────────────────────────────────────
// Reads the current color of the `mode_standby` power icon in the mat-toolbar.
// The icon is hidden (isLoading=true) while AMT HTTP calls are in flight, so
// this function:
//   step 1 — icon visible → click → wait postClickWindowMs for color → return
//   step 2 — icon hidden  → reload page; poll hiddenReloadWaitMs → reload again only if still hidden
// Loops until a color is read or totalTimeoutMs expires.

export const waitForPowerIconColor = (
  totalTimeoutMs = 30000,
  postClickWindowMs = 15000, // max time to wait after click for the icon to reappear
  hiddenReloadWaitMs = 20000 // wait after reload before re-checking icon visibility
): Cypress.Chainable<string> => {
  let startedAt = 0

  const getVisiblePowerIcon = (): JQuery<HTMLElement> =>
    Cypress.$('mat-toolbar mat-icon')
      .filter((_, el) => el.textContent?.trim() === 'mode_standby' && Cypress.$(el).is(':visible'))
      .first()

  const timeRemaining = (): number => totalTimeoutMs - (Date.now() - startedAt)

  const buildTimeoutError = (): Error =>
    new Error(`Timed out after ${totalTimeoutMs}ms waiting to read the power icon color.`)

  // After a click, isLoading=true hides the icon while the HTTP call is in flight.
  // Poll every 200ms for up to windowMs for the icon to reappear, then return its color.
  // Returns null if the icon never reappeared within the window.
  const readIconColor = (windowMs: number): Cypress.Chainable<string | null> => {
    const deadline = Date.now() + windowMs
    const poll = (): Cypress.Chainable<string | null> => {
      return cy.wrap(null, { log: false }).then((): Cypress.Chainable<string | null> => {
        const $icon = getVisiblePowerIcon()
        if ($icon.length > 0) {
          return cy.wrap(getComputedStyle($icon[0]).color as string | null, { log: false })
        }
        if (Date.now() >= deadline) return cy.wrap(null as string | null, { log: false })
        return cy.wait(200, { log: false }).then(poll)
      }) as Cypress.Chainable<string | null>
    }
    return poll()
  }

  // Step 2: icon is hidden — reload the page, then poll every 500ms until the icon
  // reappears (getPowerState() HTTP call completes after ngOnInit).
  // Only reloads again if the icon is STILL hidden after the full hiddenReloadWaitMs window.
  const reloadUntilVisible = (): Cypress.Chainable<null> => {
    if (timeRemaining() <= 0) throw buildTimeoutError()

    const waitForIconAfterReload = (deadline: number): Cypress.Chainable<null> => {
      return cy.wrap(null, { log: false }).then((): Cypress.Chainable<null> => {
        if (getVisiblePowerIcon().length > 0) return cy.wrap(null, { log: false })
        if (Date.now() >= deadline || timeRemaining() <= 0) {
          return reloadUntilVisible()
        }
        return cy.wait(500, { log: false }).then(() => waitForIconAfterReload(deadline))
      }) as unknown as Cypress.Chainable<null>
    }

    return cy
      .task('log', '  Power icon hidden — reloading page …')
      .then(() => cy.reload())
      .then(() => cy.get('mat-toolbar', { timeout: Math.min(10000, timeRemaining()), log: false }).should('be.visible'))
      .then(() => {
        const waitMs = Math.min(hiddenReloadWaitMs, timeRemaining())
        cy.task('log', `  Waiting up to ${waitMs / 1000}s for icon to appear after reload …`)
        return waitForIconAfterReload(Date.now() + waitMs)
      }) as unknown as Cypress.Chainable<null>
  }

  const attempt = (): Cypress.Chainable<string> => {
    return cy.wrap(null, { log: false }).then((): Cypress.Chainable<string> => {
      if (!startedAt) startedAt = Date.now()
      if (timeRemaining() <= 0) throw buildTimeoutError()

      const $icon = getVisiblePowerIcon()

      if ($icon.length > 0) {
        // Step 1: click icon to trigger getPowerState() HTTP call, then read the updated color.
        // Use cy.get() instead of cy.wrap($icon) so Cypress re-queries the DOM at click time —
        // cy.wrap() on a stale jQuery reference fails if Angular re-rendered between capture and click.
        const windowMs = Math.min(postClickWindowMs, timeRemaining())
        return cy
          .task('log', `  Power icon visible — clicking to refresh state (reading color within ${windowMs / 1000}s) …`)
          .then(() =>
            cy
              .get('mat-toolbar mat-icon', { log: false })
              .filter((_, el) => el.textContent?.trim() === 'mode_standby')
              .filter(':visible')
              .first()
              .click({ force: true })
          )
          .then(() => readIconColor(windowMs))
          .then((color): string | Cypress.Chainable<string> => {
            if (color !== null) return color
            if (timeRemaining() <= 0) throw buildTimeoutError()
            if (getVisiblePowerIcon().length === 0) {
              return reloadUntilVisible().then(attempt)
            }
            return attempt()
          }) as Cypress.Chainable<string>
      }

      return reloadUntilVisible().then(attempt) as Cypress.Chainable<string>
    }) as unknown as Cypress.Chainable<string>
  }

  return attempt()
}

// ─── assertPowerIconColor ─────────────────────────────────────────────────────
// Logs the color snapshot and asserts it matches expectedRgb.

export const assertPowerIconColor = (
  actualColor: string,
  expectedRgb: string,
  expectedLabel: string
): Cypress.Chainable => {
  const snapshotChain = cy.task('log', `  Power icon color snapshot: ${actualColor}`)
  const logChain =
    actualColor !== expectedRgb
      ? snapshotChain.then(() =>
          cy.task(
            'log',
            `  ❌ Assertion failed: Power icon must be ${expectedLabel} (${expectedRgb}) — got ${actualColor}`
          )
        )
      : snapshotChain
  return logChain.then(() => {
    expect(actualColor, `Power icon must be ${expectedLabel} (${expectedRgb}) — got ${actualColor}`).to.eq(expectedRgb)
  })
}

// ─── refreshAndAssertPowerIconColor ──────────────────────────────────────────
// Reads the power icon color and asserts it matches expectedRgb.
// On mismatch, reloads the page and retries up to maxRetries times.

export const refreshAndAssertPowerIconColor = (
  expectedRgb: string,
  expectedLabel: string,
  maxRetries = 3,
  totalTimeoutMs = 60000,
  retryIntervalMs = 15000, // wait between reload and next read attempt on color mismatch
  postCheckWaitMs = 4000
): void => {
  cy.task(
    'log',
    `  Power icon check: reading icon (up to ${totalTimeoutMs / 1000}s), verifying ${expectedLabel} (max ${maxRetries} reload retries on mismatch, ${retryIntervalMs / 1000}s between retries)`
  )

  const tryRead = (retriesLeft: number): Cypress.Chainable => {
    return waitForPowerIconColor(totalTimeoutMs).then((actualColor): Cypress.Chainable => {
      if (actualColor === expectedRgb) {
        return assertPowerIconColor(actualColor, expectedRgb, expectedLabel)
      }
      if (retriesLeft <= 0) {
        return assertPowerIconColor(actualColor, expectedRgb, expectedLabel)
      }
      return cy
        .task(
          'log',
          `  ⚠️ Color mismatch (got ${actualColor}, expected ${expectedLabel} ${expectedRgb}) — reloading page (${retriesLeft} ${retriesLeft === 1 ? 'retry' : 'retries'} left) …`
        )
        .then(() => cy.reload())
        .then(() => cy.get('mat-toolbar', { timeout: 10000, log: false }).should('be.visible'))
        .then(() => cy.task('log', `  Waiting ${retryIntervalMs / 1000}s before next read attempt …`))
        .then(() => cy.wait(retryIntervalMs))
        .then(() => tryRead(retriesLeft - 1))
    })
  }

  tryRead(maxRetries)
  cy.wait(postCheckWaitMs)
}

// ─── ensureDevicePoweredOn ────────────────────────────────────────────────────
/**
 * Verifies the device is powered On via the API; sends wakeAction if it is not.
 *
 * @param wakeAction  AMT power action to use when device is not On.
 *                    Defaults to PowerActions.PowerUp (OOB — works from any state
 *                    including Sleep, Hibernate, and Soft-Off).
 */
export const ensureDevicePoweredOn = (
  ctx: UiTestContext,
  phaseLabel: string,
  successMessage: string,
  checkTimeoutMs = 15000,
  waitAfterPowerUpMs = 30000,
  wakeAction: number = PowerActions.PowerUp
): void => {
  if (!ctx.token || !ctx.resolvedDeviceGuid) return

  cy.task('log', `  ${phaseLabel}: checking device power state …`)
  cy.request({
    method: 'GET',
    url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
    headers: authHeaders(ctx),
    failOnStatusCode: false,
    timeout: checkTimeoutMs
  }).then((stateRes) => {
    const state = (stateRes.body as Record<string, number>).powerstate
    const label = PowerStateLabels[state] ?? `unknown(${state})`

    const statusLogChain =
      stateRes.status !== httpCodes.SUCCESS
        ? cy.task(
            'log',
            `  ❌ Assertion failed: ${phaseLabel}: GET power/state must return HTTP 200 — got ${stateRes.status}`
          )
        : cy.wrap(null, { log: false })

    return statusLogChain
      .then(() => {
        expect(stateRes.status, `${phaseLabel}: GET power/state must return HTTP 200`).to.eq(httpCodes.SUCCESS)
      })
      .then(() => {
        cy.task('log', `  ${phaseLabel}: checking for powerstate = ${state} (${label})`)

        if (state === PowerStateValues.On) {
          cy.task('log', `  ✅ ${successMessage}`)
          return
        }

        cy.task('log', `  ${phaseLabel}: state is not On — sending Power Up (action ${wakeAction}) …`)
        cy.request({
          method: 'POST',
          url: `${mpsBaseUrl()}/api/v1/amt/power/action/${ctx.resolvedDeviceGuid}`,
          headers: authHeaders(ctx),
          body: { action: wakeAction },
          failOnStatusCode: false,
          timeout: checkTimeoutMs
        }).then((wakeRes) => {
          const wakeLogChain =
            wakeRes.status !== httpCodes.SUCCESS
              ? cy.task(
                  'log',
                  `  ❌ Assertion failed: ${phaseLabel}: Power Up (action ${wakeAction}) must return HTTP 200 — got ${wakeRes.status}`
                )
              : cy.wrap(null, { log: false })

          return wakeLogChain
            .then(() => {
              expect(wakeRes.status, `${phaseLabel}: Power Up (action ${wakeAction}) must return HTTP 200`).to.eq(
                httpCodes.SUCCESS
              )
            })
            .then(() => {
              cy.task(
                'log',
                `  ${phaseLabel}: Power Up (action ${wakeAction}) → HTTP ${wakeRes.status}; waiting ${waitAfterPowerUpMs / 1000}s to re-check …`
              )
              cy.wait(waitAfterPowerUpMs)
              cy.request({
                method: 'GET',
                url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
                headers: authHeaders(ctx),
                failOnStatusCode: false,
                timeout: checkTimeoutMs
              }).then((reCheckRes) => {
                const newState = (reCheckRes.body as Record<string, number>).powerstate
                const newLabel = PowerStateLabels[newState] ?? `unknown(${newState})`

                const reCheckStatusLogChain =
                  reCheckRes.status !== httpCodes.SUCCESS
                    ? cy.task(
                        'log',
                        `  ❌ Assertion failed: ${phaseLabel}: re-check GET power/state must return HTTP 200 — got ${reCheckRes.status}`
                      )
                    : cy.wrap(null, { log: false })

                return reCheckStatusLogChain
                  .then(() => {
                    expect(reCheckRes.status, `${phaseLabel}: re-check GET power/state must return HTTP 200`).to.eq(
                      httpCodes.SUCCESS
                    )
                  })
                  .then(() => cy.task('log', `  ${phaseLabel}: re-check powerstate = ${newState} (${newLabel})`))
                  .then(() => {
                    if (newState !== PowerStateValues.On) {
                      return cy.task(
                        'log',
                        `  ❌ Assertion failed: ${phaseLabel}: device must be On (${PowerStateValues.On}) after Power Up — got ${newState} (${newLabel})`
                      )
                    }
                    return cy.wrap(undefined, { log: false })
                  })
                  .then(() => {
                    expect(
                      newState,
                      `${phaseLabel}: device must be On (${PowerStateValues.On}) after Power Up — got ${newState} (${newLabel})`
                    ).to.eq(PowerStateValues.On)
                  })
                  .then(() => cy.task('log', `  ✅ ${successMessage}`))
              })
            })
        })
      })
  })
}

// ─── setupAuthAndGuid ─────────────────────────────────────────────────────────
/**
 * Authenticates against the MPS API and resolves the device GUID into ctx.
 *
 * Must be called inside a before(function () { ... }) block so that skipFn
 * can be passed as `() => this.skip()` with the correct Mocha context bound.
 * Populates ctx.token and ctx.resolvedDeviceGuid on success.
 */
export const setupAuthAndGuid = (ctx: UiTestContext, skipFn: () => void): void => {
  cy.request({
    method: 'POST',
    url: `${mpsAuthBaseUrl()}/api/v1/authorize`,
    body: {
      username: (Cypress.env('MPS_USERNAME') as string) ?? 'standalone',
      password: (Cypress.env('MPS_PASSWORD') as string) ?? 'G@ppm0ym'
    },
    failOnStatusCode: false,
    timeout: 15000
  })
    .then((authRes) => {
      const authLogChain =
        authRes.status !== httpCodes.SUCCESS
          ? cy
              .task('log', `  API auth → HTTP ${authRes.status}`)
              .then(() =>
                cy.task('log', `  ❌ Assertion failed: MPS /api/v1/authorize must return 200 — got ${authRes.status}`)
              )
          : cy.task('log', `  API auth → HTTP ${authRes.status}`)

      return authLogChain
        .then(() => {
          expect(authRes.status, 'MPS /api/v1/authorize must return 200').to.eq(httpCodes.SUCCESS)
        })
        .then(() => {
          ctx.token = (authRes.body as Record<string, string>).token
          cy.task('log', '  ✅ JWT token obtained')

          // Step B — resolve device GUID
          const configuredGuid = ((Cypress.env('DEVICE_GUID') as string) ?? '').trim()
          if (configuredGuid) {
            ctx.resolvedDeviceGuid = configuredGuid
            cy.task('log', `  ✅ Using DEVICE_GUID: ${ctx.resolvedDeviceGuid}`)
            return
          }
          cy.task('log', '  DEVICE_GUID not set — auto-fetching first connected device …')
          cy.request({
            method: 'GET',
            url: `${mpsBaseUrl()}/api/v1/devices?$top=50&$skip=0&$count=true`,
            headers: authHeaders(ctx),
            failOnStatusCode: false,
            timeout: 15000
          }).then((devRes) => {
            if (devRes.status !== httpCodes.SUCCESS) {
              cy.task('log', `  ⚠️  GET /api/v1/devices → HTTP ${devRes.status} — skipping`)
              skipFn()
              return
            }
            const body = devRes.body as { data?: { guid: string; connectionStatus?: boolean }[] }
            const connected = (body.data ?? []).filter((d) => d.connectionStatus === true)
            if (!connected.length) {
              cy.task('log', '  ⚠️  No connected devices found — skipping')
              skipFn()
              return
            }
            ctx.resolvedDeviceGuid = connected[0].guid
            cy.task('log', `  ✅ Auto-detected GUID (first connected): ${ctx.resolvedDeviceGuid}`)
          })
        })
    })
    .then(() => {
      ensureDevicePoweredOn(ctx, 'Precondition', 'Precondition passed: device is On')
    })
}

// ─── UI navigation helpers ────────────────────────────────────────────────────

/**
 * Visits the Web UI login page, fills credentials, and dismisses the optional
 * "about" notice.  Handles self-signed TLS cert warning automatically.
 */
export const loginToWebUi = (): void => {
  cy.task('log', '  Step 1: Logging in to Web UI …')
  cy.visit(webUiBaseUrl(), { failOnStatusCode: false, timeout: 30000 })

  // Handle TLS cert warning if present (self-signed)
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('#details-button').length > 0) {
      cy.get('#details-button').click()
      cy.get('#proceed-link').click()
    }
  })

  cy.get('[name=userId]', { timeout: 15000 })
    .should('be.visible')
    .type((Cypress.env('MPS_USERNAME') as string) ?? 'standalone')
  cy.get('[name=Password]').type((Cypress.env('MPS_PASSWORD') as string) ?? 'G@ppm0ym')
  cy.get('#btnLogin').click()

  // Close "about" notice if it appears (cloud mode)
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('[data-cy="closeNotice"]').length > 0) {
      cy.get('[data-cy="closeNotice"]').click()
    }
  })
  cy.task('log', '  ✅ Logged in to Web UI')
}

/**
 * Navigates to the device detail page and waits for the toolbar to render.
 */
export const navigateToDevicePage = (devicePageUrl: string): void => {
  cy.task('log', `  Step 2: Navigating to ${devicePageUrl}`)
  cy.visit(devicePageUrl, { failOnStatusCode: false, timeout: 30000 })
  cy.get('mat-toolbar', { timeout: 15000 }).should('be.visible')
  cy.task('log', '  ✅ Device detail page loaded')
}

/**
 * Opens the "more_vert" power options dropdown in the device detail toolbar.
 * Waits 500ms for the CDK overlay animation to complete.
 */
export const openPowerOptionsMenu = (): void => {
  cy.task('log', '  Step 3: Opening power options menu (more_vert) …')
  // Click the more_vert button directly (last mat-icon-button in mat-toolbar).
  // Do NOT use .within() — it moves Cypress focus away from the button which
  // causes Angular Material to immediately close the menu before we can click.
  cy.get('mat-toolbar button[mat-icon-button]').last().click()
  cy.wait(500)
  cy.task('log', '  ✅ Power options menu opened')
}
