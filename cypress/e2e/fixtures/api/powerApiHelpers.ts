/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Shared helpers for ping-based AMT power action API functional tests.
 *
 * Consumed by:
 *   cypress/e2e/integration/power-control/reset-api.spec.ts
 *   cypress/e2e/integration/power-control/power-cycle-api.spec.ts
 *   cypress/e2e/integration/power-control/soft-reset-api.spec.ts
 *
 * Provides:
 *   - URL / auth accessors    (mpsBaseUrl, mpsAuthBaseUrl, deviceIp, authHeaders)
 *   - Device power guard      (ensureDevicePoweredOn)
 *   - Suite setup             (setupApiAuthAndGuid)  — full before() block
 *   - Test step helpers       (verifyDeviceIsOnBefore, pingPreCheck,
 *                              sendPowerActionAndVerify, disconnectCheck,
 *                              reconnectWait, verifyPowerStateOnAfter)
 */

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { PowerActions, PowerStateValues, PowerStateLabels } from 'cypress/e2e/fixtures/api/power'
import { PingResult, waitForPingDisconnect, waitForPingReconnect } from 'cypress/e2e/fixtures/api/pingUtils'

// ─── Shared test context ──────────────────────────────────────────────────────
// Each spec creates one instance and passes it to all helpers.
// Using an object lets helper functions mutate token/guid fields that are
// assigned during before() and read during the test.
export interface ApiTestContext {
  token: string
  resolvedDeviceGuid: string
}

// ─── URL / auth accessors ─────────────────────────────────────────────────────

export const mpsBaseUrl = (): string => Cypress.env('MPS_BASEURL') as string

export const mpsAuthBaseUrl = (): string => (Cypress.env('MPS_AUTH_BASEURL') as string | undefined) ?? mpsBaseUrl()

export const deviceIp = (): string => ((Cypress.env('DEVICE') as string) ?? '').trim()

export const authHeaders = (ctx: ApiTestContext): Record<string, string> => ({
  Authorization: `Bearer ${ctx.token}`
})

// ─── ensureDevicePoweredOn ────────────────────────────────────────────────────

/**
 * Checks the current AMT power state and, if not On, sends a PowerUp action
 * and waits for the device to boot.  Used both as a precondition in before()
 * and as a cleanup guard in afterEach().
 */
export const ensureDevicePoweredOn = (
  ctx: ApiTestContext,
  phaseLabel: string,
  successMessage: string,
  checkTimeoutMs = 15000,
  waitAfterPowerUpMs = 30000
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
        cy.task('log', `  ${phaseLabel}: powerstate = ${state} (${label})`)

        if (state === PowerStateValues.On) {
          cy.task('log', `  ✅ ${successMessage}`)
          return
        }

        cy.task('log', `  ${phaseLabel}: state is not On — sending Power Up (action ${PowerActions.PowerUp}) …`)
        cy.request({
          method: 'POST',
          url: `${mpsBaseUrl()}/api/v1/amt/power/action/${ctx.resolvedDeviceGuid}`,
          headers: authHeaders(ctx),
          body: { action: PowerActions.PowerUp },
          failOnStatusCode: false,
          timeout: checkTimeoutMs
        }).then((wakeRes) => {
          const wakeLogChain =
            wakeRes.status !== httpCodes.SUCCESS
              ? cy.task(
                  'log',
                  `  ❌ Assertion failed: ${phaseLabel}: Power Up must return HTTP 200 — got ${wakeRes.status}`
                )
              : cy.wrap(null, { log: false })

          return wakeLogChain
            .then(() => {
              expect(wakeRes.status, `${phaseLabel}: Power Up must return HTTP 200`).to.eq(httpCodes.SUCCESS)
            })
            .then(() => {
              cy.task('log', `  ${phaseLabel}: Power Up sent; waiting ${waitAfterPowerUpMs / 1000}s for boot …`)
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

// ─── setupApiAuthAndGuid ─────────────────────────────────────────────────────

/**
 * Full before() logic: prints the suite banner, authenticates with MPS,
 * resolves the device GUID (from env or auto-fetch), and runs a precondition
 * check that the device is On.
 *
 * @param ctx        Mutable context object — token and guid are written here.
 * @param suiteLabel One-line suite name shown in the log banner.
 * @param skipFn     Call this.skip bound to the Mocha context: () => this.skip()
 */
export const setupApiAuthAndGuid = (ctx: ApiTestContext, suiteLabel: string, skipFn: () => void): void => {
  cy.task('log', '\n════════════════════════════════════════════════════════')
  cy.task('log', ` ${suiteLabel}`)
  cy.task('log', `  MPS base:      ${mpsBaseUrl()}`)
  cy.task('log', `  MPS auth base: ${mpsAuthBaseUrl()}`)
  cy.task('log', `  Device IP:     ${deviceIp() || '(not set — DEVICE env var required)'}`)
  cy.task('log', '════════════════════════════════════════════════════════')

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

          const configuredGuid = ((Cypress.env('DEVICE_GUID') as string) ?? '').trim()
          if (configuredGuid) {
            ctx.resolvedDeviceGuid = configuredGuid
            cy.task('log', `  ✅ Using DEVICE_GUID: ${ctx.resolvedDeviceGuid}`)
            return
          }
          cy.task('log', '  DEVICE_GUID not set — auto-fetching first device …')
          cy.request({
            method: 'GET',
            url: `${mpsBaseUrl()}/api/v1/devices?$top=1&$skip=0&$count=true`,
            headers: authHeaders(ctx),
            failOnStatusCode: false,
            timeout: 15000
          }).then((devRes) => {
            if (devRes.status !== httpCodes.SUCCESS) {
              cy.task('log', `  ⚠️  GET /api/v1/devices → HTTP ${devRes.status} — skipping`)
              skipFn()
              return
            }
            const body = devRes.body as { data?: { guid: string }[] }
            if (!body.data?.length) {
              cy.task('log', '  ⚠️  No registered devices — skipping')
              skipFn()
              return
            }
            ctx.resolvedDeviceGuid = body.data[0].guid
            cy.task('log', `  ✅ Auto-detected GUID: ${ctx.resolvedDeviceGuid}`)
          })
        })
    })
    .then(() => {
      ensureDevicePoweredOn(ctx, 'Precondition', 'Precondition passed: device is On')
    })
}

// ─── Test step helpers ────────────────────────────────────────────────────────

/**
 * Step 1: GET power/state and assert the device is currently On (2).
 */
export const verifyDeviceIsOnBefore = (ctx: ApiTestContext, actionLabel: string): void => {
  cy.task('log', `  Step 1: GET power/state — verifying device is On (${PowerStateValues.On}) …`)
  cy.request({
    method: 'GET',
    url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
    headers: authHeaders(ctx),
    failOnStatusCode: false,
    timeout: 15000
  }).then((stateRes) => {
    const state = (stateRes.body as Record<string, number>).powerstate
    const label = PowerStateLabels[state] ?? `unknown(${state})`
    const statusLogChain =
      stateRes.status !== httpCodes.SUCCESS
        ? cy.task('log', `  ❌ Assertion failed: GET power/state must return HTTP 200 — got ${stateRes.status}`)
        : cy.wrap(null, { log: false })
    return statusLogChain
      .then(() => {
        expect(stateRes.status, 'GET power/state must return HTTP 200').to.eq(httpCodes.SUCCESS)
      })
      .then(() => cy.task('log', `  powerstate: ${state} (${label})`))
      .then(() => {
        if (state !== PowerStateValues.On) {
          return cy.task(
            'log',
            `  ❌ Assertion failed: device must be On (${PowerStateValues.On}) before ${actionLabel} — got ${state} (${label})`
          )
        }
        return cy.wrap(undefined, { log: false })
      })
      .then(() => {
        expect(state, `Device must be On before ${actionLabel} — got ${state} (${label})`).to.eq(PowerStateValues.On)
      })
      .then(() => cy.task('log', '  ✅ Device is On'))
  })
}

/**
 * Step 2: ICMP ping pre-check — confirms the device IP is reachable before
 * relying on ping to detect the post-action disconnect.
 */
export const pingPreCheck = (ip: string, actionLabel: string): void => {
  cy.task('log', `  Step 2: Ping pre-check — verifying ${ip} is reachable …`)
  cy.task<PingResult>('ping', { host: ip }, { log: false, timeout: 10000 }).then((result) => {
    cy.task(
      'log',
      `    [ping] ${new Date().toISOString()}  ${result.success ? '✓' : '✗'} ${ip}  (${result.durationMs}ms)  output: ${result.output}`
    )
    const logChain = !result.success
      ? cy.task(
          'log',
          `  ❌ Assertion failed: ping pre-check — ${ip} must be reachable before ${actionLabel} (got no reply). Check DEVICE value and firewall.`
        )
      : cy.wrap(null, { log: false })
    logChain.then(() => {
      expect(
        result.success,
        `Ping pre-check: ${ip} must be reachable. Verify DEVICE env var and that ICMP is not blocked.`
      ).to.be.true
    })
    cy.task('log', '  ✅ Ping pre-check passed — device is reachable')
  })
}

/**
 * Step 3: POST /api/v1/amt/power/action and assert HTTP 200 + ReturnValue=0.
 */
export const sendPowerActionAndVerify = (ctx: ApiTestContext, action: number, actionLabel: string): void => {
  cy.task('log', `  Step 3: POST power/action — sending ${actionLabel} (action ${action}) …`)
  cy.request({
    method: 'POST',
    url: `${mpsBaseUrl()}/api/v1/amt/power/action/${ctx.resolvedDeviceGuid}`,
    headers: authHeaders(ctx),
    body: { action },
    failOnStatusCode: false,
    timeout: 15000
  }).then((actionRes) => {
    // MPS wraps the WSMAN response: { Body: { ReturnValue: 0 } }
    // Console returns directly:     { ReturnValue: 0 }
    const body = actionRes.body as { Body?: { ReturnValue?: number; ReturnValueStr?: string }; ReturnValue?: number }
    const returnValue = body.Body?.ReturnValue ?? body.ReturnValue
    const returnValueStr = body.Body?.ReturnValueStr ?? (returnValue === 0 ? 'SUCCESS' : `code ${returnValue}`)
    const statusLogChain =
      actionRes.status !== httpCodes.SUCCESS
        ? cy.task('log', `  ❌ Assertion failed: POST power/action must return HTTP 200 — got ${actionRes.status}`)
        : cy.wrap(null, { log: false })
    return statusLogChain
      .then(() => {
        expect(actionRes.status, 'POST power/action must return HTTP 200').to.eq(httpCodes.SUCCESS)
      })
      .then(() =>
        cy.task('log', `  POST power/action → HTTP ${actionRes.status}, ReturnValue=${returnValue} (${returnValueStr})`)
      )
      .then(() => {
        if (returnValue !== 0) {
          return cy.task(
            'log',
            `  ❌ Assertion failed: ReturnValue must be 0 (SUCCESS) — got ${returnValue} (${returnValueStr})`
          )
        }
        return cy.wrap(undefined, { log: false })
      })
      .then(() => {
        expect(returnValue, `ReturnValue must be 0 (SUCCESS) — got ${returnValue} (${returnValueStr})`).to.eq(0)
      })
      .then(() => cy.task('log', `  ✅ ${actionLabel} command accepted (ReturnValue=0)`))
  })
}

/**
 * Step 4: Poll ping after a power action and require a continuous ICMP failure
 * streak of at least `continuousFailMs` milliseconds within `windowMs`.
 * This confirms the device actually went offline (main power rail was cut or
 * OS restarted).
 */
export const disconnectCheck = (ip: string, continuousFailMs: number, windowMs: number, intervalMs = 1000): void => {
  const requiredSec = (continuousFailMs / 1000).toFixed(0)
  const windowMin = (windowMs / 60000).toFixed(0)
  cy.task('log', `  Step 4: Disconnect check — polling ping, requiring ≥${requiredSec} s continuous failure …`)
  cy.task('log', `         Host: ${ip}  |  Required: ${requiredSec} s continuous failure  |  Timeout: ${windowMin} min`)
  cy.task('log', '         Each ping logged in real-time as [ping] lines.')

  waitForPingDisconnect(ip, continuousFailMs, windowMs, intervalMs).then((r) => {
    cy.task('log', `  Disconnect check complete — ${r.attempts} ping(s) sent.`)
    if (r.confirmed) {
      cy.task(
        'log',
        `  ✅ DISCONNECT CONFIRMED: ping failed continuously for ${(r.continuousFailMs / 1000).toFixed(1)}s (≥${requiredSec}s required)`
      )
    } else {
      cy.task(
        'log',
        `  ❌ Assertion failed: disconnect NOT confirmed — best streak was ${(r.continuousFailMs / 1000).toFixed(1)}s (required ≥${requiredSec}s within ${windowMin} min)`
      )
    }
    expect(
      r.confirmed,
      `Disconnect check: ping to ${ip} must fail continuously for ≥${requiredSec} s within ${windowMin} min. ` +
        `Best streak: ${(r.continuousFailMs / 1000).toFixed(1)}s`
    ).to.be.true
  })
}

/**
 * Step 5: Poll ping every `intervalMs` until the device is reachable again,
 * up to `timeoutMs`.  Confirms the device successfully rebooted.
 */
export const reconnectWait = (ip: string, timeoutMs: number, intervalMs = 2000): void => {
  const timeoutMin = (timeoutMs / 60000).toFixed(0)
  cy.task('log', `  Step 5: Reconnect wait — polling ping every ${intervalMs / 1000} s, max ${timeoutMin} minutes …`)
  cy.task('log', `         Host: ${ip}`)

  waitForPingReconnect(ip, timeoutMs, intervalMs).then((r) => {
    cy.task('log', `  Reconnect check complete — ${r.attempts} ping(s) sent.`)
    if (r.reconnected) {
      cy.task('log', `  ✅ RECONNECTED: ping to ${ip} succeeded after ${(r.elapsedMs / 1000).toFixed(1)}s`)
    } else {
      cy.task(
        'log',
        `  ❌ Assertion failed: device did NOT reconnect within ${timeoutMin} minutes (${r.attempts} pings, all failed)`
      )
    }
    expect(
      r.reconnected,
      `Reconnect check: ping to ${ip} must succeed within ${timeoutMin} minutes. Elapsed: ${(r.elapsedMs / 1000).toFixed(1)}s`
    ).to.be.true
  })
}

/**
 * Step 6: GET power/state and assert On (2), retrying up to `maxAttempts`
 * times (10 s apart) to allow AMT ME to re-establish its CIRA session after
 * the OS boots back up.
 */
export const verifyPowerStateOnAfter = (ctx: ApiTestContext, actionLabel: string, maxAttempts = 3): void => {
  cy.task(
    'log',
    `  Step 6: GET power/state — expecting On (${PowerStateValues.On}), up to ${maxAttempts} attempts (10 s apart) …`
  )

  const check = (attempt: number): Cypress.Chainable<void> => {
    return cy
      .request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
        headers: authHeaders(ctx),
        failOnStatusCode: false,
        timeout: 30000
      })
      .then((res): Cypress.Chainable<void> => {
        const state = (res.body as Record<string, number>).powerstate
        const label = PowerStateLabels[state] ?? `unknown(${state})`
        return cy
          .task(
            'log',
            `  Step 6 [attempt ${attempt}/${maxAttempts}]: HTTP ${res.status}, powerstate=${state} (${label})`
          )
          .then((): Cypress.Chainable<void> => {
            if (res.status === httpCodes.SUCCESS && state === PowerStateValues.On) {
              return cy.task('log', `  ✅ AMT power state confirmed On (${state}) — device fully back online`)
            }
            if (attempt < maxAttempts) {
              const reason =
                res.status !== httpCodes.SUCCESS ? `HTTP ${res.status}` : `powerstate=${state} (${label}), not On yet`
              return cy
                .task('log', `  ⚠️  ${reason} — retrying in 10 s (attempt ${attempt + 1}/${maxAttempts}) …`)
                .then(() => cy.wait(10000, { log: false }))
                .then(() => check(attempt + 1))
            }
            const errorMsg =
              res.status !== httpCodes.SUCCESS
                ? `GET power/state must return HTTP 200 — got ${res.status}`
                : `powerstate must be On (${PowerStateValues.On}) after ${actionLabel} — got ${state} (${label})`
            return cy
              .task('log', `  ❌ Assertion failed (all ${maxAttempts} attempts exhausted): ${errorMsg}`)
              .then(() => {
                expect(res.status, 'GET power/state must return HTTP 200').to.eq(httpCodes.SUCCESS)
                expect(
                  state,
                  `powerstate must be On (${PowerStateValues.On}) after ${actionLabel} — got ${state} (${label})`
                ).to.eq(PowerStateValues.On)
                return cy.wrap(undefined as unknown as void, { log: false })
              })
          }) as Cypress.Chainable<void>
      })
  }

  check(1)
}
