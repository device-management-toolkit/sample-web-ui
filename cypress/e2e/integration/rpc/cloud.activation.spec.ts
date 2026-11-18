/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// ---------------------------------------------------------------------------
// Cloud activation spec — runs when CLOUD=true (any OS).
// Activates against the RPS server via wss:// using Docker.
//
// Routing is controlled by activation.spec.ts.  When run standalone the
// ISOLATE guard below acts as a safety net.
// ---------------------------------------------------------------------------

import {
  AMTInfo,
  addArgsToCommandCandidates,
  buildCloudActivateCommandCandidates,
  buildTimeSyncInfoCommand,
  execConfig,
  execCommand,
  buildOutput,
  execWithCompatibilityFallback,
  buildInfoCommand,
  getAmtInfo,
  getAmtInfoWithRetry,
  getAmtVersion,
  notActivatedControlModes
} from './rpc.helpers'

if (Cypress.expose('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  {
    let amtInfo: AMTInfo

    // AMT versions differ in casing and may omit controlMode until state settles.
    const normalizedNotActivatedModes = notActivatedControlModes.map((mode) => mode.toLowerCase())
    const getNormalizedControlMode = (info: Partial<AMTInfo> | undefined): string =>
      (info?.controlMode ?? '').toString().trim().toLowerCase()
    const assertNotActivatedWhenAvailable = (info: Partial<AMTInfo> | undefined): void => {
      const controlMode = getNormalizedControlMode(info)
      if (controlMode.length === 0) {
        return
      }

      expect(controlMode).to.be.oneOf(normalizedNotActivatedModes)
    }

    function waitForRasConnected(remainingAttempts = 20, intervalMs = 15000): void {
      cy.task('log', `Checking RAS connectivity (${remainingAttempts} retries remaining)`)
      getAmtInfo(infoCommand).then((info) => {
        const remoteStatus = (info.ras?.remoteStatus ?? '').toLowerCase()
        cy.task('log', `RAS remote status: ${remoteStatus || 'unavailable'}`)
        if (remoteStatus === 'connected') {
          return
        }
        if (remainingAttempts <= 0) {
          throw new Error(
            `Timed out waiting for RAS Remote Status to become "connected" (last seen: "${info.ras?.remoteStatus}")`
          )
        }
        cy.wait(intervalMs)
        waitForRasConnected(remainingAttempts - 1, intervalMs)
      })
    }

    // Environment variables
    const profileName: string = Cypress.expose('PROFILE_NAME') as string
    const fqdn: string = Cypress.expose('ACTIVATION_URL')
    const rpcDockerImage: string = Cypress.expose('RPC_DOCKER_IMAGE')
    const parts: string[] = profileName ? profileName.split('-') : []
    const isAdminControlModeProfile = /^(?:acmactivate|acm)(?:-|$)/i.test(profileName)
    const isWin = Cypress.platform === 'win32'
    const rpcVersion = String(Cypress.expose('RPC_VERSION') ?? 'v3')
      .trim()
      .toLowerCase()
    const isRpcV2 = /^v?2(?:\.|$)/.test(rpcVersion)
    const supportsTimeSyncDiagnostics = !isRpcV2
    const passwordFlag = isRpcV2 ? '-password' : '--password'

    // Default: use Docker (Linux/Mac); Windows overrides handled internally by the builders.
    const infoCommand = buildInfoCommand({ isWin, rpcDockerImage })
    const timeSyncInfoCommand = buildTimeSyncInfoCommand({ isWin, rpcDockerImage })
    let baseActivateCommands: string[] = []
    let activateCommands: string[] = []
    let amtVersion = ''
    let lmsAvailable = false

    const getLocalTimeSyncEnabled = (): Cypress.Chainable<number> =>
      execCommand(timeSyncInfoCommand, execConfig).then((result) => {
        const { stdout, combined } = buildOutput(result)
        expect(result.code, `Time-sync diagnostics failed:\n${combined}`).to.equal(0)
        const jsonStart = stdout.indexOf('[')
        expect(jsonStart, `Expected diagnostics JSON, got:\n${combined}`).to.be.at.least(0)
        const records = JSON.parse(stdout.slice(jsonStart)) as {
          data?: {
            Body?: {
              PullResponse?: {
                TimeSynchronizationServiceItems?: { LocalTimeSyncEnabled?: number | string }[]
              }
            }
          }
        }[]
        const value = records[0]?.data?.Body?.PullResponse?.TimeSynchronizationServiceItems?.[0]?.LocalTimeSyncEnabled
        expect(String(value), 'LocalTimeSyncEnabled').to.match(/^[012]$/)
        return Number(value)
      })

    before(() => {
      return cy.env(['AMT_PASSWORD']).then(({ AMT_PASSWORD }) => {
        getAmtInfo(infoCommand).then((info) => {
          amtVersion = getAmtVersion(info)
          baseActivateCommands = buildCloudActivateCommandCandidates({
            isWin,
            rpcDockerImage,
            amtVersion,
            fqdn,
            profileName
          })

          const amtPassword = AMT_PASSWORD
          activateCommands =
            amtPassword && amtPassword.trim().length > 0
              ? addArgsToCommandCandidates(baseActivateCommands, `${passwordFlag} ${amtPassword}`)
              : baseActivateCommands
        })
      })
    })

    context('Negative Activation Test', () => {
      if (isAdminControlModeProfile) {
        it('Should NOT activate ACM when domain suffix is not registered in RPS', () => {
          return cy.env(['AMT_PASSWORD']).then(({ AMT_PASSWORD }) => {
            // Confirm the negative activation starts from an unprovisioned device.
            cy.setup()
            getAmtInfo(infoCommand).then((info) => {
              assertNotActivatedWhenAvailable(info)
            })

            // Reject the domain suffix without changing the AMT activation state.
            const invalidDomainCommands = addArgsToCommandCandidates(
              baseActivateCommands,
              `--password ${AMT_PASSWORD} -d dontmatch.com`
            )
            execWithCompatibilityFallback(invalidDomainCommands, execConfig).then((result) => {
              const { combined } = buildOutput(result)
              cy.log(combined)
              expect(combined).to.contain(
                'Specified AMT domain suffix: dontmatch.com does not match list of available AMT domain suffixes.'
              )
            })
            getAmtInfoWithRetry(infoCommand).then((info) => {
              assertNotActivatedWhenAvailable(info)
            })
          })
        })
      }
    })

    describe('Device Activation - Cloud', () => {
      context('TC_ACTIVATION_DEVICE_ACTIVATE', () => {
        beforeEach(() => {
          cy.setup()
          return getAmtInfoWithRetry(infoCommand)
            .then((info) => {
              amtInfo = info
              if (!supportsTimeSyncDiagnostics) {
                return cy.wrap(false)
              }
              expect(amtInfo.localTlsEnforced, 'RPC amtinfo localTlsEnforced').to.be.a('boolean')
              return cy.task<boolean>('isLmsAvailable', { localTlsEnforced: amtInfo.localTlsEnforced })
            })
            .then((available) => {
              lmsAvailable = available
              return cy.wait(1000)
            })
        })

        it('Should Activate Device', () => {
          assertNotActivatedWhenAvailable(amtInfo)
          const canReadTimeSyncViaDiagnostics =
            supportsTimeSyncDiagnostics && !(amtInfo.localTlsEnforced === true && !lmsAvailable)
          if (canReadTimeSyncViaDiagnostics) {
            getLocalTimeSyncEnabled().should('equal', 0)
          } else {
            cy.log('Skipping pre-activation time-sync diagnostic: unsupported for this RPC version/device combination')
          }

          cy.task('log', 'Starting cloud activation RPC command')
          execWithCompatibilityFallback(activateCommands, execConfig, ({ result, combinedOutput }) => {
            return result.code !== 0 && /IncorrectPermissions/i.test(combinedOutput)
          }).then((result) => {
            cy.task('log', `Cloud activation RPC command exited with code ${result.code}`)
            const { stdout, stderr, combined } = buildOutput(result)
            const primaryOutput = stdout.length > 0 ? stdout : stderr

            if (/IncorrectPermissions/i.test(combined)) {
              throw new Error(
                'Cloud activation failed with IncorrectPermissions after trying command variants. Verify AMT/MPS credentials and profile permissions for this device.'
              )
            }

            if (parseInt(amtVersion) < 12 && parseInt(amtInfo.buildNumber) < 3000) {
              expect(combined).to.contain(
                'Only version 10.0.47 with build greater than 3000 can be remotely configured'
              )
              return
            }

            if (isAdminControlModeProfile) {
              expect(combined).to.match(/admin control mode/i)
            } else {
              expect(combined).to.match(/client control mode/i)
            }

            if (parts[2] === 'CIRA') {
              expect(combined).to.match(/CIRA(?::\s*|\s+)(?:Connection:?\s*)?Configured/i)
            } else if (parseInt(amtVersion) >= 19) {
              expect(combined).to.match(/TLS:\s*(?:Already )?Configured/i)
            } else {
              expect(combined).to.match(/TLS:\s*Configured/i)
            }

            if (profileName.endsWith('WiFi')) {
              expect(combined).to.match(/(?:Wired )?Network:\s*Wired Network Configured/i)
              expect(combined).to.match(/Wireless(?: Network)?:?\s*(?:Wireless )?Configured/i)
            } else {
              expect(combined).to.match(/(?:Wired )?Network:\s*Wired Network Configured/i)
            }

            if (primaryOutput.length > 0) {
              try {
                const parsed = JSON.parse(primaryOutput)
                expect(parsed.status).to.equal('success')
                expect(parsed.profile).to.equal(profileName)
              } catch {
                cy.log('Activation output is not JSON formatted')
              }
            }

            if (canReadTimeSyncViaDiagnostics) {
              cy.task('log', 'Reading post-activation LocalTimeSyncEnabled')
              getLocalTimeSyncEnabled().should('equal', lmsAvailable ? 1 : 2)
            } else {
              cy.log(
                'Skipping post-activation time-sync diagnostic: unsupported for this RPC version/device combination'
              )
            }

            cy.task('log', 'Post-activation time-sync check complete; waiting 120 seconds before RAS verification')
            cy.wait(120000)

            waitForRasConnected()

            cy.task('log', 'RAS connected; starting device UI verification')
            // Re-query amtinfo after activation to get the updated IP address
            getAmtInfo(infoCommand).then((postActivationInfo) => {
              cy.log(`Post-activation wired IP: ${postActivationInfo.wiredAdapter?.ipAddress}`)
              cy.log(`Post-activation wireless IP: ${postActivationInfo.wirelessAdapter?.ipAddress}`)

              cy.intercept(/devices\/.*$/).as('getdevices')
              cy.goToPage('Devices')
              cy.wait('@getdevices')

              // Cloud identifies devices by UUID
              cy.get('mat-cell').contains(postActivationInfo.uuid).parent().click()
            })

            cy.wait(5000)

            cy.get('[data-cy="chipVersion"]').should('not.be.empty')
            cy.get('[data-cy="manufacturer"]').should('not.be.empty')
            cy.get('[data-cy="model"]').should('not.be.empty')
            cy.get('[data-cy="serialNumber"]').should('not.be.empty')
            cy.get('[data-cy="provisioningMode"]').should('not.be.empty')

            if (parseInt(amtVersion) < 11) {
              cy.get('[data-cy="biosManufacturer"]').should('not.be.empty')
              cy.get('[data-cy="biosVersion"]').should('not.be.empty')
              cy.get('[data-cy="biosReleaseData"]').should('not.be.empty')
              cy.get('[data-cy="biosTargetOS"]').should('not.be.empty')

              cy.get('[data-cy="bankLabel"]').first().should('not.be.empty')
              cy.get('[data-cy="bankCapacity"]').first().should('not.be.empty')
              cy.get('[data-cy="bankMaxClockSpeed"]').first().should('not.be.empty')
              cy.get('[data-cy="bankSerialNumber"]').first().should('not.be.empty')

              cy.get('[data-cy="auditLogEntry"]').its('length').should('be.gt', 0)
            }
          })
        })
      })
    })
  }
}
