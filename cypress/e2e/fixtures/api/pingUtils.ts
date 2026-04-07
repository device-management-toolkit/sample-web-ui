/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Shared ping-based connectivity verification helpers.
 *
 * Used by power-action specs (Power Cycle, Reset, etc.) to verify that a
 * device physically disconnects and reconnects after an OOB power command.
 *
 * The underlying `cy.task('ping')` is implemented in cypress.config.ts and
 * runs in Node.js via child_process.execSync — it always returns a structured
 * result and never throws into the Cypress command queue, even when the
 * device's CIRA session is down.
 */

export interface PingResult {
  success: boolean
  output: string
  durationMs: number
}

/**
 * Polls ICMP ping to `host` until it has failed **continuously** for at least
 * `minContinuousFailMs` milliseconds, confirming the device is offline.
 *
 * If the streak is broken by a successful ping, the counter resets and polling
 * continues until `overallTimeoutMs` expires.
 *
 * @param host               IP or hostname to ping.
 * @param minContinuousFailMs Minimum unbroken failure duration required (ms). Default 7000.
 * @param overallTimeoutMs   Hard wall-clock limit for the whole check (ms). Default 3 min.
 * @param pingIntervalMs     Delay between pings when reachable (ms). Default 1000.
 * @returns `{ confirmed, continuousFailMs, attempts }`
 */
export const waitForPingDisconnect = (
  host: string,
  minContinuousFailMs = 7000,
  overallTimeoutMs = 3 * 60 * 1000,
  pingIntervalMs = 1000
): Cypress.Chainable<{ confirmed: boolean; continuousFailMs: number; attempts: number }> => {
  let startedAt = 0
  let consecutiveFailStart = 0
  let attempts = 0
  const loop = (): Cypress.Chainable<{ confirmed: boolean; continuousFailMs: number; attempts: number }> => {
    return cy.wrap(null, { log: false }).then(() => {
      if (!startedAt) startedAt = Date.now()
      if (Date.now() - startedAt >= overallTimeoutMs) {
        const continuousMs = consecutiveFailStart > 0 ? Date.now() - consecutiveFailStart : 0
        return cy.wrap({ confirmed: false, continuousFailMs: continuousMs, attempts })
      }
      return cy.task<PingResult>('ping', { host }, { log: false, timeout: 10000 }).then((result) => {
        attempts++
        const ts = new Date().toISOString()
        const continuousMs = consecutiveFailStart > 0 ? Date.now() - consecutiveFailStart : 0
        const logLine = result.success
          ? `    [ping] ${ts}  ✓ ${host} reachable  (${result.durationMs}ms)`
          : `    [ping] ${ts}  ✗ ${host} unreachable  (${result.durationMs}ms)  ← DISCONNECTED  streak=${(continuousMs / 1000).toFixed(1)}s`
        return cy
          .task('log', logLine, { log: false })
          .then((): Cypress.Chainable<{ confirmed: boolean; continuousFailMs: number; attempts: number }> => {
            if (!result.success) {
              if (consecutiveFailStart === 0) consecutiveFailStart = Date.now()
              const elapsed = Date.now() - consecutiveFailStart
              if (elapsed >= minContinuousFailMs) {
                return cy.wrap<{ confirmed: boolean; continuousFailMs: number; attempts: number }>({
                  confirmed: true,
                  continuousFailMs: elapsed,
                  attempts
                })
              }
              return loop()
            }
            if (consecutiveFailStart > 0) {
              const streakMs = Date.now() - consecutiveFailStart
              consecutiveFailStart = 0
              return cy
                .task(
                  'log',
                  `    [ping] Streak reset — ping succeeded after ${(streakMs / 1000).toFixed(1)}s of failure`,
                  { log: false }
                )
                .then(() => cy.wait(pingIntervalMs, { log: false }))
                .then(loop)
            }
            return cy.wait(pingIntervalMs, { log: false }).then(loop)
          })
      }) as Cypress.Chainable<{ confirmed: boolean; continuousFailMs: number; attempts: number }>
    }) as unknown as Cypress.Chainable<{ confirmed: boolean; continuousFailMs: number; attempts: number }>
  }
  return loop()
}

/**
 * Polls ICMP ping to `host` every `pingIntervalMs` milliseconds until it
 * succeeds (device is back online) or `maxWaitMs` expires.
 *
 * @param host           IP or hostname to ping.
 * @param maxWaitMs      Maximum wait time (ms). Default 3 min.
 * @param pingIntervalMs Delay between pings when unreachable (ms). Default 2000.
 * @returns `{ reconnected, elapsedMs, attempts }`
 */
export const waitForPingReconnect = (
  host: string,
  maxWaitMs = 3 * 60 * 1000,
  pingIntervalMs = 2000
): Cypress.Chainable<{ reconnected: boolean; elapsedMs: number; attempts: number }> => {
  let startedAt = 0
  let attempts = 0
  const loop = (): Cypress.Chainable<{ reconnected: boolean; elapsedMs: number; attempts: number }> => {
    return cy.wrap(null, { log: false }).then(() => {
      if (!startedAt) startedAt = Date.now()
      const elapsed = Date.now() - startedAt
      if (elapsed >= maxWaitMs) {
        return cy.wrap({ reconnected: false, elapsedMs: elapsed, attempts })
      }
      return cy.task<PingResult>('ping', { host }, { log: false, timeout: 10000 }).then((result) => {
        attempts++
        const elapsed2 = Date.now() - startedAt
        const ts = new Date().toISOString()
        const logLine = result.success
          ? `    [ping] ${ts}  ✓ ${host} reachable  ← RECONNECTED  (${result.durationMs}ms, ${(elapsed2 / 1000).toFixed(1)}s elapsed)`
          : `    [ping] ${ts}  ✗ ${host} unreachable  (${result.durationMs}ms, ${(elapsed2 / 1000).toFixed(1)}s elapsed — waiting …)`
        return cy
          .task('log', logLine, { log: false })
          .then((): Cypress.Chainable<{ reconnected: boolean; elapsedMs: number; attempts: number }> => {
            if (result.success)
              return cy.wrap<{ reconnected: boolean; elapsedMs: number; attempts: number }>({
                reconnected: true,
                elapsedMs: elapsed2,
                attempts
              })
            return cy.wait(pingIntervalMs, { log: false }).then(loop)
          })
      }) as Cypress.Chainable<{ reconnected: boolean; elapsedMs: number; attempts: number }>
    }) as unknown as Cypress.Chainable<{ reconnected: boolean; elapsedMs: number; attempts: number }>
  }
  return loop()
}
