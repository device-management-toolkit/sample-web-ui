/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Combined power-control functional test suite.
 *
 * All 8 power-control scenarios run under a single describe('POWER-CONTROL')
 * with one context() block per scenario. Authentication and device GUID
 * resolution are performed once in the shared top-level before() hook.
 *
 * Contexts (in sequence):
 *   (1) TC_POWER-CONTROL_POWER-CAPABILITIES   – GET /api/v1/amt/power/capabilities/:guid
 *   (2) TC_POWER-CONTROL_POWER-STATE          – GET /api/v1/amt/power/state/:guid
 *   (3) TC_POWER-CONTROL_POWER-CYCLE          – POST power/action(5)  + ping disconnect/reconnect
 *   (4) TC_POWER-CONTROL_RESET                – POST power/action(10) + ping disconnect/reconnect
 *   (5) TC_POWER-CONTROL_SOFT-RESET           – POST power/action(14) + ping disconnect/reconnect
 *   (6) TC_POWER-CONTROL_SLEEP                – Web UI → Sleep  (S3)
 *   (7) TC_POWER-CONTROL_HIBERNATE            – Web UI → Hibernate (S4)
 *   (8) TC_POWER-CONTROL_SOFT-OFF             – Web UI → Soft-Off (S5)
 *
 * Environment variables:
 *   BASEURL          Web UI base URL  (default: http://localhost:4200/)
 *   MPS_BASEURL      MPS API base URL (default: https://localhost:8181)
 *   MPS_AUTH_BASEURL Auth URL override for Cloud/Kong deployments
 *                    (default: same as MPS_BASEURL)
 *   MPS_USERNAME     MPS / Web UI username
 *   MPS_PASSWORD     MPS / Web UI password
 *   DEVICE_GUID      Target AMT device GUID (auto-fetched if not set)
 *   DEVICE           IP address of the device under test (required for API ping tests)
 */

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import {
  PowerActions,
  PowerActionLabels,
  PowerStateValues,
  PowerStateLabels,
  OsPowerSavingStateValues,
  OsPowerSavingStateLabels
} from 'cypress/e2e/fixtures/api/power'
import {
  deviceIp,
  verifyDeviceIsOnBefore,
  pingPreCheck,
  sendPowerActionAndVerify,
  disconnectCheck,
  reconnectWait,
  verifyPowerStateOnAfter
} from 'cypress/e2e/fixtures/api/powerApiHelpers'
import {
  webUiBaseUrl,
  mpsBaseUrl,
  mpsAuthBaseUrl,
  authHeaders,
  refreshAndAssertPowerIconColor,
  ensureDevicePoweredOn,
  setupAuthAndGuid,
  loginToWebUi,
  navigateToDevicePage,
  openPowerOptionsMenu
} from 'cypress/e2e/fixtures/api/powerUiHelpers'

// ─── Shared context (populated in the top-level before(), used by all contexts) ──
// Structurally compatible with both ApiTestContext and UiTestContext.
const ctx = { token: '', resolvedDeviceGuid: '' }

// Suppress Angular HttpErrorResponse background errors from the Web UI contexts.
// The device detail page polls /api/v1/amt/features while settling after power
// state transitions. All other uncaught exceptions still cause the test to fail.
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('HttpErrorResponse')) {
    return false
  }
  return true
})

// ─────────────────────────────────────────────────────────────────────────────

describe('POWER-CONTROL', () => {
  // ── Shared before: authenticate + resolve GUID once for all contexts ─────────
  before(function () {
    cy.task('log', '\n════════════════════════════════════════════════════════')
    cy.task('log', ' POWER-CONTROL — combined suite')
    cy.task('log', `  Web UI:        ${webUiBaseUrl()}`)
    cy.task('log', `  MPS base:      ${mpsBaseUrl()}`)
    cy.task('log', `  MPS auth base: ${mpsAuthBaseUrl()}`)
    cy.task('log', `  Device IP:     ${deviceIp() || '(not set — required for API ping tests)'}`)
    cy.task('log', '════════════════════════════════════════════════════════')
    setupAuthAndGuid(ctx, () => this.skip())
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (1) TC_POWER-CONTROL_POWER-CAPABILITIES
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_POWER-CAPABILITIES', () => {
    let capabilities: Record<string, number> = {}

    beforeEach(function () {
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }
      cy.request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/amt/power/capabilities/${ctx.resolvedDeviceGuid}`,
        headers: authHeaders(ctx),
        failOnStatusCode: false,
        timeout: 15000
      }).then((res) => {
        cy.task('log', `  GET capabilities → HTTP ${res.status}  body: ${JSON.stringify(res.body)}`)
        expect(res.status, 'GET power/capabilities must return 200').to.eq(httpCodes.SUCCESS)
        capabilities = res.body as Record<string, number>
      })
    })

    it('TC_POWER_CAPABILITIES_READ_01: response HTTP 200 and body is an object', () => {
      expect(capabilities).to.be.an('object').and.not.be.empty
      cy.task('log', `  ✅ capabilities: ${JSON.stringify(capabilities)}`)
    })

    it('TC_POWER_CAPABILITIES_READ_02: all capability values are numbers', () => {
      Object.entries(capabilities).forEach(([key, value]) => {
        expect(value, `"${key}" value`).to.be.a('number')
      })
      cy.task('log', `  ✅ All ${Object.keys(capabilities).length} capability values are numbers`)
    })

    it('TC_POWER_CAPABILITIES_READ_03: response contains exactly the expected 16 capability keys', () => {
      const expectedKeys = [
        'Power up',
        'Power cycle',
        'Power down',
        'Reset',
        'Soft-off',
        'Soft-reset',
        'Sleep',
        'Hibernate',
        'Power up to BIOS',
        'Reset to BIOS',
        'Reset to IDE-R Floppy',
        'Power on to IDE-R Floppy',
        'Reset to IDE-R CDROM',
        'Power on to IDE-R CDROM',
        'Reset to PXE',
        'Power on to PXE'
      ]
      const actual = Object.keys(capabilities).sort()
      const expected = [...expectedKeys].sort()
      expect(actual, 'capability key set').to.deep.equal(expected)
      cy.task('log', `  ✅ Response contains exactly ${expectedKeys.length} expected capability keys`)
    })

    it('TC_POWER_CAPABILITIES_READ_04: Power up action code = 2', () => {
      expect(capabilities['Power up'], '"Power up" action code').to.eq(PowerActions.PowerUp)
      cy.task('log', `  ✅ "Power up" = ${capabilities['Power up']} (${PowerActionLabels[PowerActions.PowerUp]})`)
    })

    it('TC_POWER_CAPABILITIES_READ_05: Sleep action code = 4', () => {
      expect(capabilities['Sleep'], '"Sleep" action code').to.eq(PowerActions.Sleep)
      cy.task('log', `  ✅ "Sleep" = ${capabilities['Sleep']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_06: Power cycle action code = 5', () => {
      expect(capabilities['Power cycle'], '"Power cycle" action code').to.eq(PowerActions.PowerCycle)
      cy.task('log', `  ✅ "Power cycle" = ${capabilities['Power cycle']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_07: Hibernate action code = 7', () => {
      expect(capabilities['Hibernate'], '"Hibernate" action code').to.eq(PowerActions.Hibernate)
      cy.task('log', `  ✅ "Hibernate" = ${capabilities['Hibernate']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_08: Power down action code = 8', () => {
      expect(capabilities['Power down'], '"Power down" action code').to.eq(PowerActions.PowerDown)
      cy.task('log', `  ✅ "Power down" = ${capabilities['Power down']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_09: Reset action code = 10', () => {
      expect(capabilities['Reset'], '"Reset" action code').to.eq(PowerActions.Reset)
      cy.task('log', `  ✅ "Reset" = ${capabilities['Reset']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_10: Soft-off action code = 12', () => {
      expect(capabilities['Soft-off'], '"Soft-off" action code').to.eq(PowerActions.SoftOff)
      cy.task('log', `  ✅ "Soft-off" = ${capabilities['Soft-off']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_11: Soft-reset action code = 14', () => {
      expect(capabilities['Soft-reset'], '"Soft-reset" action code').to.eq(PowerActions.SoftReset)
      cy.task('log', `  ✅ "Soft-reset" = ${capabilities['Soft-reset']}`)
    })

    it('TC_POWER_CAPABILITIES_READ_12: Power up to BIOS action code = 100', () => {
      expect(capabilities['Power up to BIOS'], '"Power up to BIOS" action code').to.eq(PowerActions.PowerOnToBIOS)
      cy.task(
        'log',
        `  ✅ "Power up to BIOS" = ${capabilities['Power up to BIOS']} (${PowerActionLabels[PowerActions.PowerOnToBIOS]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_13: Reset to BIOS action code = 101', () => {
      expect(capabilities['Reset to BIOS'], '"Reset to BIOS" action code').to.eq(PowerActions.ResetToBIOS)
      cy.task(
        'log',
        `  ✅ "Reset to BIOS" = ${capabilities['Reset to BIOS']} (${PowerActionLabels[PowerActions.ResetToBIOS]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_14: Reset to IDE-R Floppy action code = 200', () => {
      expect(capabilities['Reset to IDE-R Floppy'], '"Reset to IDE-R Floppy" action code').to.eq(
        PowerActions.ResetToIDERFloppy
      )
      cy.task(
        'log',
        `  ✅ "Reset to IDE-R Floppy" = ${capabilities['Reset to IDE-R Floppy']} (${PowerActionLabels[PowerActions.ResetToIDERFloppy]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_15: Power on to IDE-R Floppy action code = 201', () => {
      expect(capabilities['Power on to IDE-R Floppy'], '"Power on to IDE-R Floppy" action code').to.eq(
        PowerActions.PowerOnToIDERFloppy
      )
      cy.task(
        'log',
        `  ✅ "Power on to IDE-R Floppy" = ${capabilities['Power on to IDE-R Floppy']} (${PowerActionLabels[PowerActions.PowerOnToIDERFloppy]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_16: Reset to IDE-R CDROM action code = 202', () => {
      expect(capabilities['Reset to IDE-R CDROM'], '"Reset to IDE-R CDROM" action code').to.eq(
        PowerActions.ResetToIDERCDROM
      )
      cy.task(
        'log',
        `  ✅ "Reset to IDE-R CDROM" = ${capabilities['Reset to IDE-R CDROM']} (${PowerActionLabels[PowerActions.ResetToIDERCDROM]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_17: Power on to IDE-R CDROM action code = 203', () => {
      expect(capabilities['Power on to IDE-R CDROM'], '"Power on to IDE-R CDROM" action code').to.eq(
        PowerActions.PowerOnToIDERCDROM
      )
      cy.task(
        'log',
        `  ✅ "Power on to IDE-R CDROM" = ${capabilities['Power on to IDE-R CDROM']} (${PowerActionLabels[PowerActions.PowerOnToIDERCDROM]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_18: Reset to PXE action code = 400', () => {
      expect(capabilities['Reset to PXE'], '"Reset to PXE" action code').to.eq(PowerActions.ResetToPXE)
      cy.task(
        'log',
        `  ✅ "Reset to PXE" = ${capabilities['Reset to PXE']} (${PowerActionLabels[PowerActions.ResetToPXE]})`
      )
    })

    it('TC_POWER_CAPABILITIES_READ_19: Power on to PXE action code = 401', () => {
      expect(capabilities['Power on to PXE'], '"Power on to PXE" action code').to.eq(PowerActions.PowerOnToPXE)
      cy.task(
        'log',
        `  ✅ "Power on to PXE" = ${capabilities['Power on to PXE']} (${PowerActionLabels[PowerActions.PowerOnToPXE]})`
      )
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (2) TC_POWER-CONTROL_POWER-STATE
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_POWER-STATE', () => {
    let stateBody: Record<string, number> = {}
    // Cloud returns 'OSPowerSavingState'; Console returns 'osPowerSavingState'
    const getOsState = (): number => stateBody['OSPowerSavingState'] ?? stateBody['osPowerSavingState']

    beforeEach(function () {
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }
      cy.request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
        headers: authHeaders(ctx),
        failOnStatusCode: false,
        timeout: 15000
      }).then((res) => {
        cy.task('log', `  GET power/state → HTTP ${res.status}  body: ${JSON.stringify(res.body)}`)
        expect(res.status, 'GET power/state must return 200').to.eq(httpCodes.SUCCESS)
        stateBody = res.body as Record<string, number>
      })
    })

    it('TC_POWER_STATE_READ_01: response HTTP 200 and body is an object', () => {
      expect(stateBody).to.be.an('object').and.not.be.empty
      cy.task('log', `  ✅ state body: ${JSON.stringify(stateBody)}`)
    })

    it('TC_POWER_STATE_READ_02: response contains powerstate field', () => {
      expect(stateBody).to.have.property('powerstate')
      cy.task('log', `  ✅ "powerstate" field present`)
    })

    it('TC_POWER_STATE_READ_03: response contains OSPowerSavingState or osPowerSavingState field', () => {
      const hasField = 'OSPowerSavingState' in stateBody || 'osPowerSavingState' in stateBody
      expect(hasField, 'response must contain OSPowerSavingState or osPowerSavingState').to.be.true
      const key = 'OSPowerSavingState' in stateBody ? 'OSPowerSavingState' : 'osPowerSavingState'
      cy.task('log', `  ✅ "${key}" field present`)
    })

    it('TC_POWER_STATE_READ_04: powerstate is a non-negative integer', () => {
      const state = stateBody['powerstate']
      expect(state, '"powerstate"').to.be.a('number').and.gte(0)
      cy.task('log', `  ✅ powerstate = ${state} (${PowerStateLabels[state] ?? 'unknown'})`)
    })

    it('TC_POWER_STATE_READ_05: OSPowerSavingState is a non-negative integer', () => {
      const osState = getOsState()
      expect(osState, '"OSPowerSavingState"').to.be.a('number').and.gte(0)
      cy.task('log', `  ✅ OSPowerSavingState = ${osState} (${OsPowerSavingStateLabels[osState] ?? 'unknown'})`)
    })

    it('TC_POWER_STATE_READ_06: powerstate is a recognised AMT power state value (0–16)', () => {
      const state = stateBody['powerstate']
      const knownStates = Object.keys(PowerStateLabels).map(Number)
      expect(knownStates, `powerstate ${state} must be a known AMT CIM power state`).to.include(state)
      cy.task('log', `  ✅ powerstate ${state} is recognised: "${PowerStateLabels[state]}"`)
    })

    it('TC_POWER_STATE_READ_07: OSPowerSavingState is FullPower (2) or OsPowerSaving (3) — not Unknown/Unsupported', () => {
      const osState = getOsState()
      // 0 = Unknown      — only returned when GetOSPowerSavingState() fails (API error fallback)
      // 1 = Unsupported  — platform does not support IPS_PowerManagementService
      // A healthy, connected device must report 2 (Full Power) or 3 (OS Power Saving).
      expect(
        [OsPowerSavingStateValues.FullPower, OsPowerSavingStateValues.OsPowerSaving],
        `OSPowerSavingState must be FullPower (2) or OsPowerSaving (3) — got ${osState} (${OsPowerSavingStateLabels[osState] ?? 'unknown'})`
      ).to.include(osState)
      cy.task('log', `  ✅ OSPowerSavingState ${osState} is valid: "${OsPowerSavingStateLabels[osState]}"`)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (3) TC_POWER-CONTROL_POWER-CYCLE
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_POWER-CYCLE', () => {
    before(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      ensureDevicePoweredOn(ctx, 'Precondition', 'Precondition passed: device is On')
    })

    afterEach(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      cy.task('log', '\n-- Post-test cleanup: ensuring device is On --')
      ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
      cy.wait(5000)
    })

    it('TC_POWER_ACTION_POWER_CYCLE: POST power/action(5) -> ping confirms disconnect >=7s -> ping reconnects within 3min -> assert powerstate=On', function () {
      this.timeout(10 * 60 * 1000)
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }

      const ip = deviceIp()
      if (!ip) {
        throw new Error(
          'DEVICE env var is not set. ' +
            'Supply the IP address of the device under test:\n' +
            '  --env DEVICE=<ip>   (CLI flag)\n' +
            '  DEVICE=<ip>         (OS environment variable)'
        )
      }

      cy.task('log', '\n-- TC_POWER_ACTION_POWER_CYCLE (API + ping) --')
      cy.task('log', `  Device GUID:  ${ctx.resolvedDeviceGuid}`)
      cy.task('log', `  Device IP:    ${ip}`)
      cy.task('log', `  Power Cycle = OOB action ${PowerActions.PowerCycle}`)
      cy.task('log', '  Disconnect check: ping must fail continuously for >=7 s (within 3 min of command).')
      cy.task('log', '  Reconnect check:  ping must succeed again within 3 minutes.')

      verifyDeviceIsOnBefore(ctx, 'Power Cycle')
      pingPreCheck(ip, 'Power Cycle')
      sendPowerActionAndVerify(ctx, PowerActions.PowerCycle, 'Power Cycle')
      disconnectCheck(ip, 7000, 3 * 60 * 1000)
      reconnectWait(ip, 3 * 60 * 1000)
      verifyPowerStateOnAfter(ctx, 'Power Cycle')

      cy.task('log', '  ✅ TC_POWER_ACTION_POWER_CYCLE complete: disconnect ok  reconnect ok  powerstate=On ok')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (4) TC_POWER-CONTROL_RESET
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_RESET', () => {
    before(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      ensureDevicePoweredOn(ctx, 'Precondition', 'Precondition passed: device is On')
    })

    afterEach(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      cy.task('log', '\n-- Post-test cleanup: ensuring device is On --')
      // Reset self-recovers (device boots back automatically), but guard against edge cases.
      ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
      cy.wait(5000)
    })

    it('TC_POWER_ACTION_RESET: POST power/action(10) -> ping confirms disconnect >=7s -> ping reconnects within 3min -> assert powerstate=On', function () {
      this.timeout(10 * 60 * 1000)
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }

      const ip = deviceIp()
      if (!ip) {
        throw new Error(
          'DEVICE env var is not set. ' +
            'Supply the IP address of the device under test:\n' +
            '  --env DEVICE=<ip>   (CLI flag)\n' +
            '  DEVICE=<ip>         (OS environment variable)'
        )
      }

      cy.task('log', '\n-- TC_POWER_ACTION_RESET (API + ping) --')
      cy.task('log', `  Device GUID:  ${ctx.resolvedDeviceGuid}`)
      cy.task('log', `  Device IP:    ${ip}`)
      cy.task('log', `  Reset = OOB action ${PowerActions.Reset}`)
      cy.task('log', '  Disconnect check: ping must fail continuously for >=7 s (within 3 min of command).')
      cy.task('log', '  Reconnect check:  ping must succeed again within 3 minutes.')

      verifyDeviceIsOnBefore(ctx, 'Reset')
      pingPreCheck(ip, 'Reset')
      sendPowerActionAndVerify(ctx, PowerActions.Reset, 'Reset')
      disconnectCheck(ip, 7000, 3 * 60 * 1000)
      reconnectWait(ip, 3 * 60 * 1000)
      verifyPowerStateOnAfter(ctx, 'Reset')

      cy.task('log', '  ✅ TC_POWER_ACTION_RESET complete: disconnect ok  reconnect ok  powerstate=On ok')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (5) TC_POWER-CONTROL_SOFT-RESET
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_SOFT-RESET', () => {
    before(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      ensureDevicePoweredOn(ctx, 'Precondition', 'Precondition passed: device is On')
    })

    afterEach(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      cy.task('log', '\n-- Post-test cleanup: ensuring device is On --')
      // Soft Reset self-recovers (OS restarts automatically), but guard against
      // edge cases where the OS did not respond to the ACPI signal.
      ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
      cy.wait(5000)
    })

    it('TC_POWER_ACTION_SOFT_RESET: POST power/action(14) -> ping confirms disconnect >=3s -> ping reconnects within 5min -> assert powerstate=On', function () {
      this.timeout(12 * 60 * 1000)
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }

      const ip = deviceIp()
      if (!ip) {
        throw new Error(
          'DEVICE env var is not set. ' +
            'Supply the IP address of the device under test:\n' +
            '  --env DEVICE=<ip>   (CLI flag)\n' +
            '  DEVICE=<ip>         (OS environment variable)'
        )
      }

      cy.task('log', '\n-- TC_POWER_ACTION_SOFT_RESET (API + ping) --')
      cy.task('log', `  Device GUID:  ${ctx.resolvedDeviceGuid}`)
      cy.task('log', `  Device IP:    ${ip}`)
      cy.task('log', `  Soft Reset = IB action ${PowerActions.SoftReset} (OS graceful restart)`)
      cy.task('log', '  Disconnect check: ping must fail continuously for >=3 s (within 4 min of command).')
      cy.task('log', '  Reconnect check:  ping must succeed again within 5 minutes.')

      verifyDeviceIsOnBefore(ctx, 'Soft Reset')
      pingPreCheck(ip, 'Soft Reset')
      sendPowerActionAndVerify(ctx, PowerActions.SoftReset, 'Soft Reset')
      disconnectCheck(ip, 3000, 4 * 60 * 1000)
      reconnectWait(ip, 5 * 60 * 1000)
      verifyPowerStateOnAfter(ctx, 'Soft Reset')

      cy.task('log', '  ✅ TC_POWER_ACTION_SOFT_RESET complete: disconnect ok  reconnect ok  powerstate=On ok')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (6) TC_POWER-CONTROL_SLEEP
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_SLEEP', () => {
    afterEach(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      cy.task('log', '\n── Post-test cleanup: ensuring device is On ──')
      ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
      cy.wait(5000)
    })

    it('TC_POWER_ACTION_SLEEP: login to Web UI → click Sleep in dropdown → wait 1 min → verify powerstate via API → wake to On', function () {
      this.timeout(15 * 60 * 1000)
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }

      const devicePageUrl = `${webUiBaseUrl()}/devices/${ctx.resolvedDeviceGuid}`
      cy.task('log', '\n── TC_POWER_ACTION_SLEEP (Web UI) --')
      cy.task('log', `  Device page: ${devicePageUrl}`)

      // -- Steps 1-2: Login and navigate to device page --
      loginToWebUi()
      navigateToDevicePage(devicePageUrl)

      // -- Step 2a: Verify power icon is GREEN (On) before Sleep --
      cy.task('log', '  Step 2a: Refreshing power icon, then verifying green (On) …')
      refreshAndAssertPowerIconColor('rgb(0, 128, 0)', 'green / On', 3, 60000, 4000, 15000)
      cy.task('log', '  ✅ Power icon is green -- device confirmed On in Web UI')

      // -- Step 3: Open the "more_vert" power options dropdown --
      openPowerOptionsMenu()

      // -- Step 4: Click "Sleep" --
      cy.task('log', '  Step 4: Clicking "Sleep" menu item …')
      cy.get('.cdk-overlay-container .mat-mdc-menu-item', { timeout: 15000 }).should('have.length.greaterThan', 0)
      cy.contains('.mat-mdc-menu-item', 'Sleep').click()
      cy.task('log', '  ✅ "Sleep" clicked -- AMT sending ACPI Sleep signal to OS')

      // -- Step 5: Wait 1 minute --
      const waitMs = 1 * 60 * 1000
      cy.task('log', `  Step 5: Waiting ${waitMs / 1000}s (1 min) for OS to process Sleep signal ...`)
      cy.wait(waitMs)
      cy.task('log', '  ✅ Wait complete')

      // -- Step 6: Verify AMT power state via API --
      cy.task('log', '  Step 6: Checking AMT power state via API …')
      cy.request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
        headers: authHeaders(ctx),
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
            if (state !== PowerStateValues.SleepDeep) {
              return cy.task(
                'log',
                `  ❌ Assertion failed: powerstate value must be 4 (Sleep Deep / S3) -- got ${state} (${label})`
              )
            }
            return cy.wrap(undefined, { log: false })
          })
          .then(() => {
            expect(state, `powerstate value must be 4 (Sleep Deep / S3) -- got ${state} (${label})`).to.eq(
              PowerStateValues.SleepDeep
            )
          })
          .then(() => cy.task('log', `  ✅ Power state verified: ${state} (${label})`))
      })

      // -- Step 6a: Verify power icon turned YELLOW (Sleep) in Web UI --
      cy.task('log', '  Step 6a: Refreshing power icon, then verifying yellow (Sleep) …')
      refreshAndAssertPowerIconColor('rgb(255, 255, 0)', 'yellow / Sleep', 3, 60000, 4000, 15000)
      cy.task('log', '  ✅ Power icon is yellow -- device Sleep state confirmed in Web UI')

      cy.task('log', '  ✅ Main test steps complete -- cleanup will ensure device is powered back On')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (7) TC_POWER-CONTROL_HIBERNATE
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_HIBERNATE', () => {
    afterEach(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      cy.task('log', '\n── Post-test cleanup: ensuring device is On ──')
      // Pass a longer waitAfterPowerUpMs (60s) -- waking from Hibernate (S4) requires
      // the OS to restore RAM from hiberfil.sys before reaching powered-on state.
      ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 60000)
      cy.wait(5000)
    })

    it('TC_POWER_ACTION_HIBERNATE: login to Web UI → click Hibernate in dropdown → wait 2 min → verify powerstate via API → wake to On', function () {
      this.timeout(15 * 60 * 1000)
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }

      const devicePageUrl = `${webUiBaseUrl()}/devices/${ctx.resolvedDeviceGuid}`
      cy.task('log', '\n── TC_POWER_ACTION_HIBERNATE (Web UI) --')
      cy.task('log', `  Device page: ${devicePageUrl}`)

      // -- Steps 1-2: Login and navigate to device page --
      loginToWebUi()
      navigateToDevicePage(devicePageUrl)

      // -- Step 2a: Verify power icon is GREEN (On) before Hibernate --
      cy.task('log', '  Step 2a: Refreshing power icon, then verifying green (On) …')
      refreshAndAssertPowerIconColor('rgb(0, 128, 0)', 'green / On', 3, 60000, 15000, 4000)
      cy.task('log', '  ✅ Power icon is green -- device confirmed On in Web UI')

      // -- Step 3: Open the "more_vert" power options dropdown --
      openPowerOptionsMenu()

      // -- Step 4: Click "Hibernate" --
      cy.task('log', '  Step 4: Clicking "Hibernate" menu item …')
      cy.get('.cdk-overlay-container .mat-mdc-menu-item', { timeout: 15000 }).should('have.length.greaterThan', 0)
      cy.contains('.mat-mdc-menu-item', 'Hibernate').click()
      cy.task(
        'log',
        `  ✅ "Hibernate" clicked -- AMT requesting OS hibernate (action ${PowerActions.Hibernate}) -- OS will save RAM to disk`
      )

      // -- Step 5: Wait 2 minutes --
      // Hibernate saves the entire RAM contents to disk before powering off (S4).
      // Allow up to 2 minutes for the OS to complete the save and reach S4.
      const waitMs = 2 * 60 * 1000
      cy.task('log', `  Step 5: Waiting ${waitMs / 1000}s (2 min) for OS to complete Hibernate (save-to-disk) ...`)
      cy.wait(waitMs)
      cy.task('log', '  ✅ Wait complete')

      // -- Step 6: Verify AMT power state via API --
      cy.task(
        'log',
        `  Step 6: Checking AMT power state via API (expecting Hibernate / S4 = ${PowerStateValues.Hibernate}) ...`
      )
      cy.request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
        headers: authHeaders(ctx),
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

      // -- Step 6a: Verify power icon turned RED (Hibernate) in Web UI --
      cy.task('log', '  Step 6a: Refreshing power icon, then verifying red (Hibernate) …')
      refreshAndAssertPowerIconColor('rgb(255, 0, 0)', 'red / Hibernate', 3, 60000, 15000, 4000)
      cy.task('log', '  ✅ Power icon is red -- device Hibernate state confirmed in Web UI')

      cy.task('log', '  ✅ Main test steps complete -- cleanup will ensure device is powered back On')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // (8) TC_POWER-CONTROL_SOFT-OFF
  // ══════════════════════════════════════════════════════════════════════════

  context('TC_POWER-CONTROL_SOFT-OFF', () => {
    afterEach(function () {
      if (!ctx.token || !ctx.resolvedDeviceGuid) return
      cy.task('log', '\n── Post-test cleanup: ensuring device is On ──')
      ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
      cy.wait(5000)
    })

    it('TC_POWER_ACTION_SOFTOFF: login to Web UI → click Soft-Off in dropdown → wait 2 min → verify powerstate via API → wake to On', function () {
      this.timeout(15 * 60 * 1000)
      if (!ctx.resolvedDeviceGuid) {
        this.skip()
        return
      }

      const devicePageUrl = `${webUiBaseUrl()}/devices/${ctx.resolvedDeviceGuid}`
      cy.task('log', '\n── TC_POWER_ACTION_SOFTOFF (Web UI) --')
      cy.task('log', `  Device page: ${devicePageUrl}`)

      // -- Steps 1-2: Login and navigate to device page --
      loginToWebUi()
      navigateToDevicePage(devicePageUrl)

      // -- Step 2a: Verify power icon is GREEN (On) before Soft-Off --
      cy.task('log', '  Step 2a: Refreshing power icon, then verifying green (On) …')
      refreshAndAssertPowerIconColor('rgb(0, 128, 0)', 'green / On', 3, 60000, 15000, 4000)
      cy.task('log', '  ✅ Power icon is green -- device confirmed On in Web UI')

      // -- Step 3: Open the "more_vert" power options dropdown --
      openPowerOptionsMenu()

      // -- Step 4: Click "Soft-Off" --
      cy.task('log', '  Step 4: Clicking "Soft-Off" menu item …')
      cy.get('.cdk-overlay-container .mat-mdc-menu-item', { timeout: 15000 }).should('have.length.greaterThan', 0)
      cy.contains('.mat-mdc-menu-item', 'Soft-Off').click()
      cy.task('log', `  ✅ "Soft-Off" clicked -- AMT sending graceful shutdown (action ${PowerActions.SoftOff}) to OS`)

      // -- Step 5: Wait 2 minutes --
      // Soft-Off requests a graceful OS shutdown. Allow up to 2 minutes for
      // the OS to complete all shutdown tasks and reach S5.
      const waitMs = 2 * 60 * 1000
      cy.task('log', `  Step 5: Waiting ${waitMs / 1000}s (2 min) for OS to complete graceful shutdown ...`)
      cy.wait(waitMs)
      cy.task('log', '  ✅ Wait complete')

      // -- Step 6: Verify AMT power state via API --
      cy.task(
        'log',
        `  Step 6: Checking AMT power state via API (expecting Power Off - Hard / S5 = ${PowerStateValues.PowerOffHard}) ...`
      )
      cy.request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/amt/power/state/${ctx.resolvedDeviceGuid}`,
        headers: authHeaders(ctx),
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
            if (state !== PowerStateValues.PowerOffHard) {
              return cy.task(
                'log',
                `  ❌ Assertion failed: powerstate must be ${PowerStateValues.PowerOffHard} (Power Off - Hard / S5) -- got ${state} (${label})`
              )
            }
            return cy.wrap(undefined, { log: false })
          })
          .then(() => {
            expect(
              state,
              `powerstate must be ${PowerStateValues.PowerOffHard} (Power Off - Hard / S5) -- got ${state} (${label})`
            ).to.eq(PowerStateValues.PowerOffHard)
          })
          .then(() => cy.task('log', `  ✅ Power state verified: ${state} (${label})`))
      })

      // -- Step 6a: Verify power icon turned RED (Off) in Web UI --
      cy.task('log', '  Step 6a: Refreshing power icon, then verifying red (Off) …')
      refreshAndAssertPowerIconColor('rgb(255, 0, 0)', 'red / Off', 3, 60000, 15000, 4000)
      cy.task('log', '  ✅ Power icon is red -- device Off state confirmed in Web UI')

      cy.task('log', '  ✅ Main test steps complete -- cleanup will ensure device is powered back On')
    })
  })
})
