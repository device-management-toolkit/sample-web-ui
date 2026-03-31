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

import { AMTInfo, execConfig, buildOutput, execWithRetry } from './activation.spec'

if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  {
    let amtInfo: AMTInfo

    // Environment variables
    const profileName: string = Cypress.env('PROFILE_NAME') as string
    const password: string = Cypress.env('AMT_PASSWORD')
    const fqdn: string = Cypress.env('ACTIVATION_URL')
    const rpcDockerImage: string = Cypress.env('RPC_DOCKER_IMAGE')
    const parts: string[] = profileName ? profileName.split('-') : []
    const isAdminControlModeProfile = parts.length > 0 && parts[0] === 'acmactivate'
    const isWin = Cypress.platform === 'win32'
    let majorVersion = ''
    let skipCertFlag = '-skipamtcertcheck'

    // Default: use Docker (Linux/Mac); Windows overrides below use rpc.exe directly
    let infoCommand = `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} amtinfo --json`
    let activateCommand = ''
    let deactivateCommand = ''

    const buildActivateCommand = (useFlag: boolean, flag = '') => {
      const flagPart = useFlag ? ` ${flag}` : ''
      if (isWin) {
        return `rpc.exe activate -u wss://${fqdn}/activate -v -n${flagPart} --profile ${profileName} --json`
      }
      return `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} activate -u wss://${fqdn}/activate -v -n${flagPart} --profile ${profileName} --json`
    }

    const buildDeactivateCommand = (useFlag: boolean, flag = '') => {
      const flagPart = useFlag ? ` ${flag}` : ''
      if (isWin) {
        return `rpc.exe deactivate -u wss://${fqdn}/activate -v -n${flagPart} -f --json --password ${password}`
      }
      return `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} deactivate -u wss://${fqdn}/activate -v -n${flagPart} -f --json --password ${password}`
    }

    const detectRPCCommandFormat = (helpOutput: string): void => {
      if (helpOutput.includes('--skip-amt-cert-check')) {
        skipCertFlag = '--skip-amt-cert-check'
        cy.log('Detected flag format: --skip-amt-cert-check')
      } else {
        cy.log('Detected flag format: -skipamtcertcheck')
      }
    }

    const updateCommandsForVersion = (version: string): void => {
      if (parseInt(version) >= 19) {
        cy.log(`AMT version ${version} detected (>= 19), using skipamtcertcheck flag: ${skipCertFlag}`)
        activateCommand = buildActivateCommand(true, skipCertFlag)
        deactivateCommand = buildDeactivateCommand(true, skipCertFlag)
      } else {
        cy.log(`AMT version ${version} detected (< 19), not using skipamtcertcheck flag`)
        activateCommand = buildActivateCommand(false)
        deactivateCommand = buildDeactivateCommand(false)
      }
    }

    if (isWin) {
      infoCommand = 'rpc.exe amtinfo --json'
    }

    // Set initial commands without flag (will be updated based on AMT version)
    activateCommand = buildActivateCommand(false)
    deactivateCommand = buildDeactivateCommand(false)

    describe('Device Activation - Cloud', () => {
      before(() => {
        const helpCommand = isWin
          ? 'rpc.exe activate --help'
          : `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} activate --help`

        cy.exec(helpCommand, { ...execConfig, failOnNonZeroExit: false }).then((result) => {
          const helpOutput = result.stdout + result.stderr
          cy.log('RPC Help Output:', helpOutput)
          detectRPCCommandFormat(helpOutput)
        })
      })

      context('TC_ACTIVATION_DEVICE_ACTIVATE_AND_DEACTIVATE', () => {
        beforeEach(() => {
          cy.setup()
          cy.exec(infoCommand, execConfig).then((result) => {
            const { stdout, stderr, combined } = buildOutput(result)
            cy.log(combined)
            const source = stdout.length > 0 ? stdout : stderr
            amtInfo = JSON.parse(source)
            const versions: string[] = amtInfo.amt.split('.')
            majorVersion = versions.length > 1 ? versions[0] : '0'
            updateCommandsForVersion(majorVersion)
          })
          cy.wait(1000)
        })

        it('Should Activate Device', () => {
          expect(amtInfo.controlMode).to.contain('pre-provisioning state')

          execWithRetry(activateCommand, execConfig).then((result) => {
            const { stdout, stderr, combined } = buildOutput(result)
            cy.log(combined)
            const primaryOutput = stdout.length > 0 ? stdout : stderr

            if (parseInt(majorVersion) < 12 && parseInt(amtInfo.buildNumber) < 3000) {
              expect(combined).to.contain(
                'Only version 10.0.47 with build greater than 3000 can be remotely configured'
              )
              return
            }

            if (isAdminControlModeProfile) {
              expect(combined).to.match(/Status: admin control mode/i)
            } else {
              expect(combined).to.match(/Status: client control mode/i)
            }

            if (parts[2] === 'CIRA') {
              expect(combined).to.contain('CIRA: Configured')
            } else {
              expect(combined).to.contain('TLS: Configured')
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
            cy.exec(infoCommand, execConfig).then((postActivationResult) => {
              const { stdout, stderr } = buildOutput(postActivationResult)
              const source = stdout.length > 0 ? stdout : stderr
              const postActivationInfo: AMTInfo = JSON.parse(source)
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

            if (parseInt(majorVersion) < 11) {
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

        it('should NOT deactivate device - invalid password', () => {
          if (amtInfo.controlMode !== 'pre-provisioning state') {
            const invalidCommand =
              deactivateCommand.slice(0, deactivateCommand.indexOf('--password')) + '--password invalidpassword'
            execWithRetry(invalidCommand, execConfig).then((result) => {
              const { combined } = buildOutput(result)
              cy.log(combined)
              expect(combined).to.contain('Unable to authenticate with AMT')
            })
          }
        })

        it('should deactivate device', () => {
          if (amtInfo.controlMode !== 'pre-provisioning state') {
            execWithRetry(deactivateCommand, execConfig).then((result) => {
              const { combined } = buildOutput(result)
              cy.log(combined)
              expect(combined).to.contain('Status: Deactivated')
              cy.wait(15000)
            })
          }
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
