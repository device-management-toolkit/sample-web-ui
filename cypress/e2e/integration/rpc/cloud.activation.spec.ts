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
  execConfig,
  buildOutput,
  execWithRetry,
  buildInfoCommand,
  buildActivateCommand,
  getAmtInfo,
  getAmtVersion,
  notActivatedControlModes
} from './rpc.helpers'

if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  {
    let amtInfo: AMTInfo

    // Environment variables
    const profileName: string = Cypress.env('PROFILE_NAME') as string
    const fqdn: string = Cypress.env('ACTIVATION_URL')
    const rpcDockerImage: string = Cypress.env('RPC_DOCKER_IMAGE')
    const parts: string[] = profileName ? profileName.split('-') : []
    const isAdminControlModeProfile = parts.length > 0 && parts[0] === 'acmactivate'
    const isWin = Cypress.platform === 'win32'

    // Default: use Docker (Linux/Mac); Windows overrides handled internally by the builders.
    const infoCommand = buildInfoCommand({ isWin, rpcDockerImage })
    let activateCommand = ''
    let amtVersion = ''

    before(() => {
      getAmtInfo(infoCommand).then((info) => {
        amtVersion = getAmtVersion(info)
        activateCommand = buildActivateCommand({
          isWin,
          rpcDockerImage,
          amtVersion,
          fqdn,
          profileName
        })
      })
    })

    describe('Device Activation - Cloud', () => {
      context('TC_ACTIVATION_DEVICE_ACTIVATE', () => {
        beforeEach(() => {
          cy.setup()
          getAmtInfo(infoCommand).then((info) => {
            amtInfo = info
          })
          cy.wait(1000)
        })

        it('Should Activate Device', () => {
          expect(amtInfo.controlMode).to.be.oneOf(notActivatedControlModes)

          execWithRetry(activateCommand, execConfig).then((result) => {
            const { stdout, stderr, combined } = buildOutput(result)
            cy.log(combined)
            const primaryOutput = stdout.length > 0 ? stdout : stderr

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
              expect(combined).to.match(/CIRA: Configured/i)
            } else if (parseInt(amtVersion) >= 19) {
              expect(combined).to.match(/TLS: Already Configured/i)
            } else {
              expect(combined).to.match(/TLS: Configured/i)
            }

            if (profileName.endsWith('WiFi')) {
              expect(combined).to.contain('Network: Wired Network Configured. Wireless Configured')
            } else {
              expect(combined).to.contain('Network: Wired Network Configured')
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

            cy.wait(120000)

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

    context('Negative Activation Test', () => {
      if (isAdminControlModeProfile) {
        it('Should NOT activate ACM when domain suffix is not registered in RPS', () => {
          activateCommand += ' -d dontmatch.com'
          execWithRetry(activateCommand, execConfig).then((result) => {
            const { combined } = buildOutput(result)
            cy.log(combined)
            expect(combined).to.contain(
              'Specified AMT domain suffix: dontmatch.com does not match list of available AMT domain suffixes.'
            )
          })
        })
      }
    })
  }
}
