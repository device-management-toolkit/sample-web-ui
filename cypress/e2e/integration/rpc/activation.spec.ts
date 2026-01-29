/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

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
  const execConfig: Cypress.ExecOptions = {
    log: true,
    failOnNonZeroExit: false,
    timeout: 240000
  } as any
  const buildOutput = (result: { stdout?: string; stderr?: string }) => {
    const stdout = result.stdout ? result.stdout.trim() : ''
    const stderr = result.stderr ? result.stderr.trim() : ''
    const combined = [stdout, stderr].filter((value) => value.length > 0).join('\n')
    return { stdout, stderr, combined }
  }

  const execWithRetry = (
    command: string,
    config: Cypress.ExecOptions,
    maxRetries = 5,
    retryInterval = 5000
  ): Cypress.Chainable<Cypress.Exec> => {
    const attemptExec = (attempt: number): Cypress.Chainable<Cypress.Exec> => {
      return cy.exec(command, config).then((result) => {
        const { combined } = buildOutput(result)

        // Check if the error is "interrupted system call"
        if (combined.includes('"msg":"interrupted system call"') && attempt < maxRetries) {
          cy.log(`Retry attempt ${attempt + 1}/${maxRetries} after interrupted system call error`)
          cy.wait(retryInterval)
          return attemptExec(attempt + 1)
        }

        return cy.wrap(result)
      })
    }

    return attemptExec(1)
  }

  // get environment variables
  const profileName: string = Cypress.env('PROFILE_NAME') as string
  const password: string = Cypress.env('AMT_PASSWORD')
  const fqdn: string = Cypress.env('ACTIVATION_URL')
  const rpcDockerImage: string = Cypress.env('RPC_DOCKER_IMAGE')
  const parts: string[] = profileName.split('-')
  const isAdminControlModeProfile = parts[0] === 'acmactivate'
  let majorVersion = ''
  let infoCommand = `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} amtinfo --json`
  let activateCommand = `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} activate -u wss://${fqdn}/activate -v -n --profile ${profileName} --json`
  let deactivateCommand = `docker run --rm --network host --device=/dev/mei0 ${rpcDockerImage} deactivate -u wss://${fqdn}/activate -v -n -f --json --password ${password}`
  if (isWin) {
    activateCommand = `rpc.exe activate -u wss://${fqdn}/activate -v -n --profile ${profileName} --json`
    infoCommand = 'rpc.exe amtinfo --json'
    deactivateCommand = `rpc.exe deactivate -u wss://${fqdn}/activate -v -n -f --json --password ${password}`
  }

  describe('Activation', () => {
    // run amt info to get amt info
    beforeEach(() => {
      cy.setup()
      cy.exec(infoCommand, execConfig).then((result) => {
        const { stdout, stderr, combined } = buildOutput(result)
        cy.log(combined)
        const source = stdout.length > 0 ? stdout : stderr
        amtInfo = JSON.parse(source)
        const versions: string[] = amtInfo.amt.split('.')
        majorVersion = versions.length > 1 ? versions[0] : '0'
      })
      cy.wait(1000)
    })

    it('Should Activate Device', () => {
      expect(amtInfo.controlMode).to.contain('pre-provisioning state')

      // activate device
      execWithRetry(activateCommand, execConfig).then((result) => {
        const { stdout, stderr, combined } = buildOutput(result)
        cy.log(combined)
        const primaryOutput = stdout.length > 0 ? stdout : stderr
        if (parseInt(majorVersion) < 12 && parseInt(amtInfo.buildNumber) < 3000) {
          expect(combined).to.contain('Only version 10.0.47 with build greater than 3000 can be remotely configured')
          return
        }

        if (isAdminControlModeProfile) {
          expect(combined).to.contain('Status: Admin control mode')
        } else {
          expect(combined).to.contain('Status: Client control mode')
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

        cy.intercept(/devices\/.*$/).as('getdevices')
        // run device tests
        cy.goToPage('Devices')
        cy.wait('@getdevices')
        cy.get('mat-cell').contains(amtInfo.uuid).parent().click()

        // wait like im not supposed to
        cy.wait(5000)

        cy.get('[data-cy="chipVersion"]').should('not.be.empty')
        cy.get('[data-cy="manufacturer"]').should('not.be.empty')
        cy.get('[data-cy="model"]').should('not.be.empty')
        cy.get('[data-cy="serialNumber"]').should('not.be.empty')

        // AMT Enabled Features
        cy.get('[data-cy="provisioningMode"]').should('not.be.empty')

        if (parseInt(majorVersion) < 11) {
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
      // deactivate
      if (amtInfo.controlMode !== 'pre-provisioning state') {
        execWithRetry(deactivateCommand, execConfig).then((result) => {
          const { combined } = buildOutput(result)
          cy.log(combined)
          expect(combined).to.contain('Status: Deactivated')
        })
      }
    })
  })

  describe('Negative Activation Test', () => {
    if (isAdminControlModeProfile) {
      it('Should NOT activate ACM when domain suffix is not registered in RPS', () => {
        activateCommand += ' -d dontmatch.com'
        execWithRetry(activateCommand, execConfig).then((result) => {
          const { stderr, combined } = buildOutput(result)
          cy.log(combined)
          expect(stderr).to.contain(
            'Specified AMT domain suffix: dontmatch.com does not match list of available AMT domain suffixes.'
          )
        })
      })
    }
  })
}
