/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Isolated run: TC_POWER_ACTION_SOFT_RESET via MPS REST API only.
 *
 * No browser / Web UI interaction â€” all steps use cy.request() against the
 * MPS API directly.
 *
 * Flow:
 *   1.  Authenticate â†’ POST /api/v1/authorize â†’ JWT
 *   2.  Resolve device GUID (env var or auto-fetch first registered device)
 *   2a. Precondition: GET /api/v1/amt/power/state â†’ assert On (2)
 *   3.  Ping pre-check: verify device IP is reachable before issuing the command
 *   4.  Send Soft Reset â†’ POST /api/v1/amt/power/action  { action: 14 }
 *       Assert HTTP 200 and ReturnValue=0
 *   5.  Disconnect check: poll ping immediately after command; require â‰¥3 s of
 *       continuous ICMP failure within a 4 min window â€” confirms the OS shut
 *       down and the device dropped off the network.
 *   6.  Reconnect wait: poll ping every 2 s until success, max 5 minutes.
 *   7.  GET /api/v1/amt/power/state â†’ assert On (2) â€” device fully back online.
 *   8.  Post-test cleanup: ensureDevicePoweredOn to guard against edge cases.
 *
 * Soft Reset vs OOB Reset
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *   Soft Reset (IB action 14) requests the OS to perform a graceful restart.
 *   Unlike OOB Reset (action 10), the disconnect is OS-mediated â€” the timing
 *   depends on how quickly the OS handles the ACPI restart signal.  The minimum
 *   continuous failure window required here is 3 s (vs 7 s for OOB Reset) to
 *   account for the slower, OS-controlled transition.  If the OS is not
 *   configured to respond to ACPI signals the API will still return HTTP 200 /
 *   ReturnValue=0 but the disconnect check may fail â€” that is an OS environment
 *   issue, not an AMT firmware failure.
 *
 * Why ping-based disconnect check?
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *   During the OS shutdown and reboot window the CIRA tunnel to MPS drops,
 *   so any cy.request() against the state endpoint may throw a hard
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

describe('TC_POWER_ACTION_SOFT_RESET - Soft Reset via MPS API (isolated run)', () => {
  before(function () {
    setupApiAuthAndGuid(ctx, 'TC_POWER_ACTION_SOFT_RESET â€” API isolated run', () => this.skip())
  })

  afterEach(function () {
    if (!ctx.token || !ctx.resolvedDeviceGuid) return
    cy.task('log', '\nâ”€â”€ Post-test cleanup: ensuring device is On â”€â”€')
    // Soft Reset self-recovers (OS restarts automatically), but guard against
    // edge cases where the OS did not respond to the ACPI signal.
    ensureDevicePoweredOn(ctx, 'Cleanup', 'Cleanup complete: device is On', 60000, 30000)
    cy.wait(5000)
  })

  it('TC_POWER_ACTION_SOFT_RESET: POST power/action(14) â†’ ping confirms disconnect â‰¥3s â†’ ping reconnects within 5min â†’ assert powerstate=On', function () {
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

    cy.task('log', '\nâ”€â”€ TC_POWER_ACTION_SOFT_RESET (API + ping) â”€â”€')
    cy.task('log', `  Device GUID:  ${ctx.resolvedDeviceGuid}`)
    cy.task('log', `  Device IP:    ${ip}`)
    cy.task('log', `  Soft Reset = IB action ${PowerActions.SoftReset} (OS graceful restart)`)
    cy.task('log', '  Disconnect check: ping must fail continuously for â‰¥3 s (within 4 min of command).')
    cy.task('log', '  Reconnect check:  ping must succeed again within 5 minutes.')

    verifyDeviceIsOnBefore(ctx, 'Soft Reset')
    pingPreCheck(ip, 'Soft Reset')
    sendPowerActionAndVerify(ctx, PowerActions.SoftReset, 'Soft Reset')
    disconnectCheck(ip, 3000, 4 * 60 * 1000)
    reconnectWait(ip, 5 * 60 * 1000)
    verifyPowerStateOnAfter(ctx, 'Soft Reset')

    cy.task('log', '  âœ… TC_POWER_ACTION_SOFT_RESET complete: disconnect âœ“  reconnect âœ“  powerstate=On âœ“')
  })
})
