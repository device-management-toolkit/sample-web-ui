/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'

interface AMTInfo {
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
if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  const isWin = Cypress.platform === 'win32'
  let amtInfo: AMTInfo
  const execConfig = {
    failOnNonZeroExit: false,
    execTimeout: 120000,
    retries: {
      runMode: 3
    }
  }

  // get environment variables
  const profileName: string = Cypress.env('PROFILE_NAME') as string
  const password: string = Cypress.env('AMT_PASSWORD')
  const fqdn: string = Cypress.env('ACTIVATION_URL')
  const rpcDockerImage: string = Cypress.env('RPC_DOCKER_IMAGE')
  const parts: string[] = profileName.split('-')
  const isAdminControlModeProfile = parts[0] === 'acmactivate'
  let majorVersion: string = ''
  let infoCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} amtinfo -json`
  let activateCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`
  let deactivateCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
  if (isWin) {
    activateCommand = `rpc.exe activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`
    infoCommand = 'rpc.exe amtinfo -json'
    deactivateCommand = `rpc.exe deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
  }

  describe('Activation', () => {
    // run amt info to get amt info
    beforeEach(() => {
      cy.setup()
      cy.exec(infoCommand, execConfig).then((result) => {
        cy.log(result.stderr)
        amtInfo = JSON.parse(result.stderr)
        const versions: string[] = amtInfo.amt.split('.')
        majorVersion = versions.length > 1 ? versions[0] : '0'
      })
      cy.wait(1000)
    })

    it('Should Activate Device', () => {
      expect(amtInfo.controlMode).to.contain('pre-provisioning state')

      // activate device
      cy.exec(activateCommand, execConfig).then((result) => {
        cy.log(result.stderr)
        if (parseInt(majorVersion) < 12 && parseInt(amtInfo.buildNumber) < 3000) {
          expect(result.stderr).to.contain('Only version 10.0.47 with build greater than 3000 can be remotely configured')
          return null
        } else {
          if (isAdminControlModeProfile) {
            expect(result.stderr).to.contain('Status: Admin control mode')
          } else {
            expect(result.stderr).to.contain('Status: Client control mode')
          }

          if (parts[2] === 'CIRA') {
            expect(result.stderr).to.contain('CIRA: Configured')
          } else {
            expect(result.stderr).to.contain('TLS: Configured')
          }

          if (profileName.endsWith('WiFi')) {
            expect(result.stderr).to.contain('Network: Wired Network Configured. Wireless Configured')
          } else {
            expect(result.stderr).to.contain('Network: Wired Network Configured.')
          }
        }
        cy.wait(60000)

        cy.wait('@stats-request')
            .its('response.statusCode')
            .should('eq', httpCodes.SUCCESS)

        cy.get('[data-cy="totalCount"]').invoke('text').then(parseInt).should('be.gt', 0)
        cy.get('[data-cy="connectedCount"]').invoke('text').then(parseInt).should('be.gt', 0)

        cy.intercept(/devices\/.*$/).as('getdevices')
        // run device tests
        cy.goToPage('Devices')
        cy.wait('@getdevices')
        cy.get('mat-cell').contains(amtInfo.uuid).parent().click()

        // wait like im not supposed to
        cy.wait(5000)

        cy.get('[data-cy="chipVersion"]').should('not.be.empty')
        cy.get('[data-cy="manufacturer"]').should('not.be.empty')
        // cy.get('[data-cy="manufacturer"]').contains('HP')
        cy.get('[data-cy="model"]').should('not.be.empty')
        cy.get('[data-cy="serialNumber"]').should('not.be.empty')
        // cy.get('[data-cy="version"]').should('not.be.empty')
        cy.get('[data-cy="amtVersion"]').should('not.be.empty')

        // AMT Enabled Features
        cy.get('[data-cy="provisioningMode"]').should('not.be.empty')

        // BIOS Summary
        cy.get('[data-cy="biosManufacturer"]').should('not.be.empty')
        cy.get('[data-cy="biosVersion"]').should('not.be.empty')
        cy.get('[data-cy="biosReleaseData"]').should('not.be.empty')
        cy.get('[data-cy="biosTargetOS"]').should('not.be.empty')

        // Memory Summary
        // TODO: Check each channel reported by the device. Currently only checking the first element in the table
        cy.get('[data-cy="bankLabel"]').first().should('not.be.empty')
        cy.get('[data-cy="bankCapacity"]').first().should('not.be.empty')
        cy.get('[data-cy="bankMaxClockSpeed"]').first().should('not.be.empty')
        cy.get('[data-cy="bankSerialNumber"]').first().should('not.be.empty')

        // Audit log entries
        cy.get('[data-cy="auditLogEntry"]').its('length').should('be.gt', 0)
      })
    })

    it('should NOT deactivate device - invalid password', () => {
      if (amtInfo.controlMode !== 'pre-provisioning state') {
        const invalidCommand = deactivateCommand.slice(0, deactivateCommand.indexOf('--password')) + '--password invalidpassword'
        cy.exec(invalidCommand, execConfig).then((result) => {
          cy.log(result.stderr)
          expect(result.stderr).to.contain('AMT password DOES NOT match stored version for Device')
          cy.wait(10000)
        })
      }
    })

    it('should deactivate device', () => {
      // deactivate
      if (amtInfo.controlMode !== 'pre-provisioning state') {
        cy.exec(deactivateCommand, execConfig).then((result) => {
          cy.log(result.stderr)
          expect(result.stderr).to.contain('Status: Deactivated')
          cy.wait(10000)
        })
      }
    })
  })

  describe('Negative Activation Test', () => {
    if (isAdminControlModeProfile) {
      it('Should NOT activate ACM when domain suffix is not registered in RPS', () => {
        cy.wait(10000)
        activateCommand += ' -d dontmatch.com'
        cy.exec(activateCommand, execConfig).then((result) => {
          expect(result.stderr).to.contain('Specified AMT domain suffix: dontmatch.com does not match list of available AMT domain suffixes.')
        })
      })
    }
  })
}
