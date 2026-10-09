/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// ---------------------------------------------------------------------------
// Console (local) activation spec — runs when CLOUD is not set/false.
// Activates via `rpc activate -local` using a local YAML profile.
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
  getAmtInfoWithIpAddressRetry,
  resolveDeviceIpAddress,
  getAmtVersion,
  notActivatedControlModes,
  getAuthEndpoint
} from './rpc.helpers'

if (Cypress.expose('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  {
    let amtInfo: AMTInfo

    // Environment variables
    const profileName: string = Cypress.expose('PROFILE_NAME') as string
    const rpcDockerImage: string = Cypress.expose('RPC_DOCKER_IMAGE')
    const parts: string[] = profileName ? profileName.split('-') : []
    const isAdminControlModeProfile = parts.length > 0 && parts[0] === 'acmactivate'
    const profileYamlFile: string = Cypress.expose('PROFILE_YAML_FILE')
    const isWin = Cypress.platform === 'win32'
    const authEndpoint = getAuthEndpoint()

    // Console gives the suite no readiness signal to poll before it touches the
    // AMT APIs: the Devices table only renders a connection status in cloud
    // mode (non-cloud shows the power state instead), and AMT's own RAS status
    // does not report the tunnel Console uses. So the settle time before the
    // device page is a plain wait -- raise it if the AMT APIs still answer 503.
    const deviceReadyWaitMs = 180000

    // Default: use Docker (Linux/Mac); Windows overrides handled internally by the builders.
    const infoCommand = buildInfoCommand({ isWin, rpcDockerImage })
    let activateCommand = ''
    let amtVersion = ''

    before(() => {
      return cy.env(['ENCRYPTION_KEY', 'MPS_PASSWORD']).then(({ ENCRYPTION_KEY, MPS_PASSWORD }) => {
        getAmtInfo(infoCommand).then((info) => {
          amtVersion = getAmtVersion(info)
          activateCommand = buildActivateCommand({
            isWin,
            rpcDockerImage,
            amtVersion,
            profileYamlFile,
            encryptionKey: ENCRYPTION_KEY,
            authEndpoint: authEndpoint,
            authUsername: Cypress.expose('MPS_USERNAME'),
            authPassword: MPS_PASSWORD
          })
        })
      })
    })

    describe('Device Activation - Console', () => {
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
              expect(combined).to.contain('Status: Device activated in Admin Control Mode')
            } else {
              expect(combined).to.contain('Status: Device activated in Client Control Mode')
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

            // Settle before touching the device page: opening it issues an AMT
            // features query, and until Console can reach the device that
            // answers 503, which Angular raises as an uncaught error and
            // Cypress fails the test on.
            cy.wait(deviceReadyWaitMs)

            // Re-query amtinfo after activation to get the updated IP address.
            // The ME can take minutes to publish an address, so poll rather
            // than waiting a fixed interval.
            getAmtInfoWithIpAddressRetry(infoCommand).then((postActivationInfo) => {
              cy.intercept(/devices\/.*$/).as('getdevices')
              cy.goToPage('Devices')
              cy.wait('@getdevices')

              // Console lists the device under the address rpc-go registered it
              // with, which is the OS address whenever AMT shares the host
              // interface and reports 0.0.0.0 for itself.
              const deviceIp = resolveDeviceIpAddress(postActivationInfo)

              if (deviceIp == null) {
                const errorMessage =
                  'Device not provisioned: no usable IP address on either adapter after activation. ' +
                  `wired=${JSON.stringify(postActivationInfo.wiredAdapter)} ` +
                  `wireless=${JSON.stringify(postActivationInfo.wirelessAdapter)}`
                cy.log(errorMessage)
                throw new Error(errorMessage)
              }

              cy.log(`Using identifier to find device: ${deviceIp}`)
              // timeout must be passed to .contains() itself -- a timeout on the
              // preceding .get() does not carry over to the chained .contains().
              cy.get('mat-cell').contains(deviceIp, { timeout: 60000 }).parent().click()
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
              cy.get('[data-cy="biosReleaseDate"]').should('not.be.empty')
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
