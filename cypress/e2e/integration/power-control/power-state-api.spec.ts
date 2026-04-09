/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Isolated run: TC_POWER_STATE_READ — GET current AMT power state via REST API.
 *
 * No browser / Web UI interaction — all steps use cy.request() against the
 * MPS API directly.
 *
 * Flow:
 *   1.  Authenticate → POST /api/v1/authorize → JWT
 *   2.  Resolve device GUID (env var or auto-fetch first registered device)
 *   3.  GET /api/v1/amt/power/state/:guid
 *       Assert HTTP 200, required fields, and valid value ranges.
 *
 * Environment variables:
 *   MPS_BASEURL      MPS API base URL (default: https://localhost:8181)
 *   MPS_AUTH_BASEURL Auth URL override for Cloud/Kong deployments
 *                    (default: same as MPS_BASEURL)
 *   MPS_USERNAME     MPS username
 *   MPS_PASSWORD     MPS password
 *   DEVICE_GUID      Target AMT device GUID (auto-fetched if not set)
 */

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { PowerStateLabels, OsPowerSavingStateValues, OsPowerSavingStateLabels } from 'cypress/e2e/fixtures/api/power'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mpsBaseUrl = (): string => (Cypress.env('MPS_BASEURL') as string) ?? 'https://localhost:8181'

const mpsAuthBaseUrl = (): string => (Cypress.env('MPS_AUTH_BASEURL') as string | undefined) ?? mpsBaseUrl()

let token = ''
let resolvedDeviceGuid = ''
const deviceGuid = (): string => resolvedDeviceGuid
const authHeaders = (): Record<string, string> => ({ Authorization: `Bearer ${token}` })

// ─────────────────────────────────────────────────────────────────────────────

describe('TC_POWER_STATE_READ - Get AMT Power State via GET /api/v1/amt/power/state/:guid', () => {
  let stateBody: Record<string, number> = {}

  before(function () {
    cy.task('log', '\n════════════════════════════════════════════════════════')
    cy.task('log', ' TC_POWER_STATE_READ — isolated run')
    cy.task('log', `  MPS base:      ${mpsBaseUrl()}`)
    cy.task('log', `  MPS auth base: ${mpsAuthBaseUrl()}`)
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
    }).then((authRes) => {
      cy.task('log', `  Auth → HTTP ${authRes.status}`)
      expect(authRes.status, 'MPS /api/v1/authorize must return 200').to.eq(httpCodes.SUCCESS)
      token = (authRes.body as Record<string, string>).token
      cy.task('log', '  ✅ JWT token obtained')

      const configuredGuid = ((Cypress.env('DEVICE_GUID') as string) ?? '').trim()
      if (configuredGuid) {
        resolvedDeviceGuid = configuredGuid
        cy.task('log', `  ✅ Using DEVICE_GUID: ${resolvedDeviceGuid}`)
        return
      }
      cy.task('log', '  DEVICE_GUID not set — auto-fetching first registered device …')
      cy.request({
        method: 'GET',
        url: `${mpsBaseUrl()}/api/v1/devices?$top=1&$skip=0&$count=true`,
        headers: authHeaders(),
        failOnStatusCode: false,
        timeout: 15000
      }).then((devRes) => {
        if (devRes.status !== httpCodes.SUCCESS) {
          cy.task('log', `  ⚠️  GET /api/v1/devices returned HTTP ${devRes.status} — skipping`)
          this.skip()
          return
        }
        const body = devRes.body as { data?: { guid: string }[] }
        if (!body.data?.length) {
          cy.task('log', '  ⚠️  No registered AMT devices — skipping')
          this.skip()
          return
        }
        resolvedDeviceGuid = body.data[0].guid
        cy.task('log', `  ✅ Auto-detected GUID: ${resolvedDeviceGuid}`)
      })
    })
  })

  // Fetch state once per test
  beforeEach(function () {
    if (!resolvedDeviceGuid) {
      this.skip()
      return
    }
    cy.request({
      method: 'GET',
      url: `${mpsBaseUrl()}/api/v1/amt/power/state/${deviceGuid()}`,
      headers: authHeaders(),
      failOnStatusCode: false,
      timeout: 15000
    }).then((res) => {
      cy.task('log', `  GET power/state → HTTP ${res.status}  body: ${JSON.stringify(res.body)}`)
      expect(res.status, 'GET power/state must return 200').to.eq(httpCodes.SUCCESS)
      stateBody = res.body as Record<string, number>
    })
  })

  // ── Individual state assertions ──────────────────────────────────────────────

  it('TC_POWER_STATE_READ_01: response HTTP 200 and body is an object', () => {
    expect(stateBody).to.be.an('object').and.not.be.empty
    cy.task('log', `  ✅ state body: ${JSON.stringify(stateBody)}`)
  })

  it('TC_POWER_STATE_READ_02: response contains powerstate field', () => {
    expect(stateBody).to.have.property('powerstate')
    cy.task('log', `  ✅ "powerstate" field present`)
  })

  it('TC_POWER_STATE_READ_03: response contains osPowerSavingState field', () => {
    expect(stateBody).to.have.property('osPowerSavingState')
    cy.task('log', `  ✅ "osPowerSavingState" field present`)
  })

  it('TC_POWER_STATE_READ_04: powerstate is a non-negative integer', () => {
    const state = stateBody['powerstate']
    expect(state, '"powerstate"').to.be.a('number').and.gte(0)
    cy.task('log', `  ✅ powerstate = ${state} (${PowerStateLabels[state] ?? 'unknown'})`)
  })

  it('TC_POWER_STATE_READ_05: osPowerSavingState is a non-negative integer', () => {
    const osState = stateBody['osPowerSavingState']
    expect(osState, '"osPowerSavingState"').to.be.a('number').and.gte(0)
    cy.task('log', `  ✅ osPowerSavingState = ${osState} (${OsPowerSavingStateLabels[osState] ?? 'unknown'})`)
  })

  it('TC_POWER_STATE_READ_06: powerstate is a recognised AMT power state value (0–16)', () => {
    const state = stateBody['powerstate']
    const knownStates = Object.keys(PowerStateLabels).map(Number)
    expect(knownStates, `powerstate ${state} must be a known AMT CIM power state`).to.include(state)
    cy.task('log', `  ✅ powerstate ${state} is recognised: "${PowerStateLabels[state]}"`)
  })

  it('TC_POWER_STATE_READ_07: osPowerSavingState is FullPower (2) or OsPowerSaving (3) — not Unknown/Unsupported', () => {
    const osState = stateBody['osPowerSavingState']
    // 0 = Unknown   — only returned when GetOSPowerSavingState() fails (API error fallback)
    // 1 = Unsupported — platform does not support IPS_PowerManagementService
    // A healthy, connected device must report 2 (Full Power) or 3 (OS Power Saving).
    expect(
      [OsPowerSavingStateValues.FullPower, OsPowerSavingStateValues.OsPowerSaving],
      `osPowerSavingState must be FullPower (2) or OsPowerSaving (3) — got ${osState} (${OsPowerSavingStateLabels[osState] ?? 'unknown'})`
    ).to.include(osState)
    cy.task('log', `  ✅ osPowerSavingState ${osState} is valid: "${OsPowerSavingStateLabels[osState]}"`)
  })
})
