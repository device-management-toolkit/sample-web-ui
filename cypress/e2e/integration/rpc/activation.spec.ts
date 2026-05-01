/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export interface AMTInfo {
  amt: string
  buildNumber: string
  controlMode: string
  dnsSuffix: string
  dnsSuffixOS: string
  hostnameOS: string
  ras: {
    networkStatus: string
    remoteStatus: string
    remoteTrigger: string
    mpsHostname: string
  }
  sku: string
  uuid: string
  wiredAdapter: {
    isEnable: boolean
    linkStatus: string
    dhcpEnabled: boolean
    dhcpMode: string
    ipAddress: string
    macAddress: string
  }
  wirelessAdapter: {
    isEnable: boolean
    linkStatus: string
    dhcpEnabled: boolean
    dhcpMode: string
    ipAddress: string
    macAddress: string
  }
}

// ---- Shared helpers --------------------------------------------------------

export const execConfig: Cypress.ExecOptions = {
  log: true,
  failOnNonZeroExit: false,
  timeout: 240000
} as any

export const buildOutput = (result: { stdout?: string; stderr?: string }) => {
  const stdout = result.stdout ? result.stdout.trim() : ''
  const stderr = result.stderr ? result.stderr.trim() : ''
  const combined = [stdout, stderr].filter((value) => value.length > 0).join('\n')
  return { stdout, stderr, combined }
}

export const execWithRetry = (
  command: string,
  config: Cypress.ExecOptions,
  maxRetries = 5,
  retryInterval = 5000
): Cypress.Chainable<Cypress.Exec> => {
  const attemptExec = (attempt: number): Cypress.Chainable<Cypress.Exec> => {
    return cy.exec(command, config).then((result) => {
      const { combined } = buildOutput(result)

      if (combined.includes('interrupted system call') && attempt < maxRetries) {
        cy.log(`Retry attempt ${attempt + 1}/${maxRetries} after interrupted system call error`)
        cy.wait(retryInterval)
        return attemptExec(attempt + 1)
      }

      return cy.wrap(result)
    })
  }

  return attemptExec(1)
}

// ---- Computed environment flags -------------------------------------------

// Exported so sub-specs can import them directly when run standalone.
const isCloud: boolean = Cypress.env('CLOUD') === 'true' || Cypress.env('CLOUD') === true

declare const require: (id: string) => unknown

if (isCloud) {
  require('./cloud.activation.spec')
} else {
  require('./console.activation.spec')
}
