/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Cypress configuration for DMTF Redfish API tests only.
 *
 * Run with:
 *   npx cypress run --config-file cypress.redfish.config.ts
 *   npm run cy-runner:redfish
 *   npm run cy-open:redfish
 *
 * These tests use cy.request() to call the Redfish API directly —
 * no Angular UI is required to be running.
 *
 * Environment variables (override via CLI --env or .env file):
 *   REDFISH_BASEURL   Base URL of the Redfish server (default: http://localhost:8181)
 *   REDFISH_USERNAME  Admin username for Basic Auth  (default: standalone)
 *   REDFISH_PASSWORD  Admin password for Basic Auth  (default: G@ppm0ym)
 *   REDFISH_SYSTEM_ID UUID of a registered AMT device (optional).
 *                     If empty/unset, Systems tests auto-detect the first
 *                     member under /redfish/v1/Systems.
 */

import { defineConfig } from 'cypress'
import * as fs from 'fs'
import * as path from 'path'

/**
 * All timestamps in this config are UTC (ISO 8601 with trailing "Z").
 * This matches the UTC timestamps written by mocha-junit-reporter inside
 * the XML <testsuite timestamp="..."> attribute, keeping everything consistent.
 */

/** UTC timestamp for log lines: "2026-02-27T07:11:51.381Z" */
const utcTimestamp = (): string => new Date().toISOString()

/** UTC timestamp safe for filenames: "2026-02-27T07-11-51Z" */
const utcFileTimestamp = (): string =>
  new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-')

export default defineConfig({
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'cypress/support/custom-reporter.js, mocha-junit-reporter',
    cypressSupportCustomReporterJsReporterOptions: {
      reportDir: 'cypress/reports',
      reportName: 'cypress-redfish-test-report'
    },
    mochaJunitReporterReporterOptions: {
      mochaFile: `cypress-redfish-api-test-output-${utcFileTimestamp()}-[hash].xml`,
      toConsole: false
    }
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  projectId: 'mxeztq',

  env: {
    // Base URL of the Redfish server (matches Postman test environment port)
    REDFISH_BASEURL: 'https://localhost:8181',
    // Credentials for Basic Auth and POST /redfish/v1/SessionService/Sessions
    REDFISH_USERNAME: 'standalone',
    REDFISH_PASSWORD: 'G@ppm0ym',
    // Optional: a real registered AMT device UUID for Systems tests.
    // If empty, tests auto-detect the first member under /redfish/v1/Systems.
    REDFISH_SYSTEM_ID: ''
  },

  // API-only tests: no browser launch strictly needed, but Cypress still
  // requires a browser context. Tests run headlessly via electron.
  chromeWebSecurity: false,
  // Allow self-signed TLS certificates from the console backend
  rejectUnauthorized: false,

  e2e: {
    setupNodeEvents(on) {
      // Create a timestamped log file under cypress/logs/ for functional test runs.
      // The file is written in real-time so you can `tail -f` it during a run.
      // cypress/logs/*.log is covered by the *.log entry in .gitignore.
      const logsDir = path.join(__dirname, 'cypress', 'logs')
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
      const logFile = path.join(logsDir, `redfish-functional-${utcFileTimestamp()}.log`)

      on('task', {
        log(message: string): null {
          const line = `${utcTimestamp()}  ${message}`
          process.stdout.write(line + '\n')
          fs.appendFileSync(logFile, line + '\n', 'utf8')
          return null
        }
      })
    },
    // Run specs under integration-redfish/ (alongside the original integration/ folder)
    specPattern: 'cypress/e2e/integration-redfish/**/*.spec.ts',
    supportFile: 'cypress/support/e2e.ts',
    screenshotOnRunFailure: false,
    // Longer timeouts for API calls that may hit real hardware
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000
  }
})
