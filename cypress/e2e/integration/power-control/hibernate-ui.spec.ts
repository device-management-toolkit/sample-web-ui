/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Isolated run: TC_POWER_ACTION_HIBERNATE via Web UI dropdown only.
 *
 * Flow:
 *   1. Log in to the Web UI (cy.visit BASEURL → fill login form)
 *   2. Navigate to the device detail page  /devices/:guid
 *   3. Open the "more_vert" power options dropdown
 *   4. Click "Hibernate"
 *   5. Wait 2 minutes for the OS to save RAM to disk and reach S4
 *   6. Verify AMT power state via GET /api/v1/amt/power/state/:guid
 *      Expects: Hibernate (7) -- suspend-to-disk (S4)
 *   7. Verify power icon turned RED (Hibernate) in the Web UI
 *   8. Wake device back to On via POST OsToFullPower (action 500)
 *
 * Environment variables:
 *   BASEURL          Web UI base URL  (default: http://localhost:4200/)
 *   MPS_BASEURL      MPS API base URL (default: https://localhost:8181)
 *   MPS_AUTH_BASEURL Auth URL override for Cloud/Kong deployments
 *                    (default: same as MPS_BASEURL)
 *   MPS_USERNAME     MPS / Web UI username
 *   MPS_PASSWORD     MPS / Web UI password
 *   DEVICE_GUID      Target AMT device GUID (auto-fetched if not set)
 */

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { PowerActions, PowerStateValues, PowerStateLabels } from 'cypress/e2e/fixtures/api/power'
import {
  UiTestContext,
  webUiBaseUrl,
  mpsBaseUrl,
  mpsAuthBaseUrl,
  refreshAndAssertPowerIconColor,
  ensureDevicePoweredOn,
  setupAuthAndGuid,
  loginToWebUi,
  navigateToDevicePage,
  openPowerOptionsMenu
} from 'cypress/e2e/fixtures/api/powerUiHelpers'

const ctx: UiTestContext = { token: '', resolvedDeviceGuid: '' }

// Suppress Angular HttpErrorResponse thrown in the background when the device detail
// page polls /api/v1/amt/features while the device is still settling after a power
// state transition. These are app-level background errors, not test failures.
// All other uncaught exceptions still cause the test to fail normally.
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('HttpErrorResponse')) {
    return false
  }
  return true
})

// ------------------------------------------------------------------

describe('TC_POWER_ACTION_HIBERNATE - Hibernate via Web UI dropdown (isolated run)', () => {
  // -- before: authenticate via MPS API + resolve GUID -------------------
  before(function () {
    cy.task('log', '\n═══════════════════════════════════════════════════════')
    cy.task('log', ' TC_POWER_ACTION_HIBERNATE ─ Web UI isolated run')
    cy.task('log', `  Web UI:        ${webUiBaseUrl()}`)
    cy.task('log', `  MPS base:      ${mpsBaseUrl()}`)
    cy.task('log', `  MPS auth base: ${mpsAuthBaseUrl()}`)
    cy.task('log', '═══════════════════════════════════════════════════════')
    setupAuthAndGuid(ctx, () => this.skip())
  })

  // -- afterEach: always clean up and ensure device is back On -----------
  afterEach(function () {
    if (!ctx.token || !ctx.resolvedDeviceGuid) return

    cy.task('log', '\n── Post-test cleanup: ensuring device is On ──')
    // Pass a longer waitAfterPowerUpMs (60s) -- waking from Hibernate (S4) requires
    // the OS to restore RAM from hiberfil.sys before reaching powered-on state.
    ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 60000)
    cy.wait(5000)
  })

  // ── TC_POWER_ACTION_HIBERNATE ------------------------------------------
  it('TC_POWER_ACTION_HIBERNATE: login to Web UI → click Hibernate in dropdown → wait 2 min → verify powerstate via API → wake to On', function () {
    this.timeout(15 * 60 * 1000)

    if (!ctx.resolvedDeviceGuid) {
      this.skip()
      return
    }

    const devicePageUrl = `${webUiBaseUrl()}/devices/${ctx.resolvedDeviceGuid}`
    cy.task('log', '\n── TC_POWER_ACTION_HIBERNATE (Web UI) --')
    cy.task('log', `  Device page: ${devicePageUrl}`)

    // -- Steps 1-2: Login and navigate to device page ------------------
    loginToWebUi()
    navigateToDevicePage(devicePageUrl)

    // -- Step 2a: Verify power icon is GREEN (On) before Hibernate ------
    cy.task('log', '  Step 2a: Refreshing power icon, then verifying green (On) …')
    refreshAndAssertPowerIconColor('rgb(0, 128, 0)', 'green / On', 3, 60000, 15000, 4000)
    cy.task('log', '  ✅ Power icon is green -- device confirmed On in Web UI')

    // -- Step 3: Open the "more_vert" power options dropdown -----------
    openPowerOptionsMenu()

    // -- Step 4: Click "Hibernate" -------------------------------------
    cy.task('log', '  Step 4: Clicking "Hibernate" menu item …')
    cy.get('.cdk-overlay-container .mat-mdc-menu-item', { timeout: 15000 }).should('have.length.greaterThan', 0)
    cy.contains('.mat-mdc-menu-item', 'Hibernate').click()
    cy.task(
      'log',
      `  ✅ "Hibernate" clicked -- AMT requesting OS hibernate (action ${PowerActions.Hibernate}) -- OS will save RAM to disk`
    )

    // -- Step 5: Wait 2 minutes ----------------------------------------
    // Hibernate saves the entire RAM contents to disk before powering off (S4).
    // Allow up to 2 minutes for the OS to complete the save and reach S4.
    const waitMs = 2 * 60 * 1000
    cy.task('log', `  Step 5: Waiting ${waitMs / 1000}s (2 min) for OS to complete Hibernate (save-to-disk) ...`)
    cy.wait(waitMs)
    cy.task('log', '  ✅ Wait complete')

    // -- Step 6: Verify AMT power state via API ------------------------
    cy.task(
      'log',
      `  Step 6: Checking AMT power state via API (expecting Hibernate / S4 = ${PowerStateValues.Hibernate}) ...`
    )
    cy.request({
      method: 'GET',
      url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
      headers: { Authorization: `Bearer ${ctx.token}` },
      failOnStatusCode: false,
      timeout: 60000
    }).then((res) => {
      const state = (res.body as Record<string, number>).powerstate
      const label = PowerStateLabels[state] ?? `unknown(${state})`

      const statusLogChain =
        res.status !== httpCodes.SUCCESS
          ? cy.task('log', `  ❌ Assertion failed: GET power/state must return HTTP 200 -- got ${res.status}`)
          : cy.wrap(null, { log: false })

      return statusLogChain
        .then(() => {
          expect(res.status, 'GET power/state must return HTTP 200').to.eq(httpCodes.SUCCESS)
        })
        .then(() => cy.task('log', `  powerstate: ${state} (${label})`))
        .then(() => {
          if (state !== PowerStateValues.Hibernate) {
            return cy.task(
              'log',
              `  ❌ Assertion failed: powerstate must be ${PowerStateValues.Hibernate} (Hibernate / S4) -- got ${state} (${label})`
            )
          }
          return cy.wrap(undefined, { log: false })
        })
        .then(() => {
          expect(
            state,
            `powerstate must be ${PowerStateValues.Hibernate} (Hibernate / S4) -- got ${state} (${label})`
          ).to.eq(PowerStateValues.Hibernate)
        })
        .then(() => cy.task('log', `  ✅ Power state verified: ${state} (${label})`))
    })

    // -- Step 6a: Verify power icon turned RED (Hibernate) in Web UI ---
    cy.task('log', '  Step 6a: Refreshing power icon, then verifying red (Hibernate) …')
    refreshAndAssertPowerIconColor('rgb(255, 0, 0)', 'red / Hibernate', 3, 60000, 15000, 4000)
    cy.task('log', '  ✅ Power icon is red -- device Hibernate state confirmed in Web UI')

    cy.task('log', '  ✅ Main test steps complete -- cleanup will ensure device is powered back On')
  })
})
