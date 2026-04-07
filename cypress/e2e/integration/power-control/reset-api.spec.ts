/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Isolated run: TC_POWER_ACTION_RESET via MPS REST API only.
 *
 * No browser / Web UI interaction � all steps use cy.request() against the
 * MPS API directly.
 *
 * Flow:
 *   1.  Authenticate ? POST /api/v1/authorize ? JWT
 *   2.  Resolve device GUID (env var or auto-fetch first registered device)
 *   2a. Precondition: GET /api/v1/amt/power/state ? assert On (2)
 *   3.  Ping pre-check: verify device IP is reachable before issuing the command
 *   4.  Send Reset ? POST /api/v1/amt/power/action  { action: 10 }
 *       Assert HTTP 200 and ReturnValue=0
 *   5.  Disconnect check: poll ping immediately after command; require =7 s of
 *       continuous ICMP failure within a 3 min window � confirms AMT cut the
 *       main power rail (hard reset).
 *   6.  Reconnect wait: poll ping every 2 s until success, max 3 minutes.
 *   7.  GET /api/v1/amt/power/state ? assert On (2) � device fully back online.
 *   8.  Post-test cleanup: ensureDevicePoweredOn to guard against edge cases.
 *
 * Why ping-based disconnect check instead of AMT state polling?
 * -------------------------------------------------------------
 *   Reset (OOB action 10) is hardware-immediate: AMT cuts and restores the
 *   main power rail within ~1�3 s.  During this window the CIRA tunnel to MPS
 *   drops, so any cy.request() against the state endpoint may throw a hard
 *   uncatchable network error inside Cypress.  Using cy.task('ping') keeps the
 *   check entirely in Node.js and always returns a structured result.
 *
 * Environment variables:
 *   MPS_BASEURL      MPS API base URL (default: https://localhost:8181)
 *   MPS_AUTH_BASEURL Auth URL override for Cloud/Kong deployments
 *                    (default: same as MPS_BASEURL)
 *   MPS_USERNAME     MPS username
 *   MPS_PASSWORD     MPS password
 *   DEVICE_GUID      Target AMT device GUID (auto-fetched if not set)
 *   DEVICE           IP address of the device under test (required for ping check)
 */

import { PowerActions } from 'cypress/e2e/fixtures/api/power'
import {
  ApiTestContext,
  deviceIp,
  ensureDevicePoweredOn,
  setupApiAuthAndGuid,
  verifyDeviceIsOnBefore,
  pingPreCheck,
  sendPowerActionAndVerify,
  disconnectCheck,
  reconnectWait,
  verifyPowerStateOnAfter
} from 'cypress/e2e/fixtures/api/powerApiHelpers'

// -----------------------------------------------------------------------------

const ctx: ApiTestContext = { token: '', resolvedDeviceGuid: '' }

describe('TC_POWER_ACTION_RESET - Reset via MPS API (isolated run)', () => {
  before(function () {
    setupApiAuthAndGuid(ctx, 'TC_POWER_ACTION_RESET � API isolated run', () => this.skip())
  })

  afterEach(function () {
    if (!ctx.token || !ctx.resolvedDeviceGuid) return
    cy.task('log', '\n-- Post-test cleanup: ensuring device is On --')
    // Reset self-recovers (device boots back automatically), but guard against
    // edge cases where it may have stayed off.
    ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
    cy.wait(5000)
  })

  it('TC_POWER_ACTION_RESET: POST power/action(10) ? ping confirms disconnect =7s ? ping reconnects within 3min ? assert powerstate=On', function () {
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
    cy.task('log', '  Disconnect check: ping must fail continuously for =7 s (within 3 min of command).')
    cy.task('log', '  Reconnect check:  ping must succeed again within 3 minutes.')

    verifyDeviceIsOnBefore(ctx, 'Reset')
    pingPreCheck(ip, 'Reset')
    sendPowerActionAndVerify(ctx, PowerActions.Reset, 'Reset')
    disconnectCheck(ip, 7000, 3 * 60 * 1000)
    reconnectWait(ip, 3 * 60 * 1000)
    verifyPowerStateOnAfter(ctx, 'Reset')

    cy.task('log', '  ? TC_POWER_ACTION_RESET complete: disconnect ?  reconnect ?  powerstate=On ?')
  })
})
