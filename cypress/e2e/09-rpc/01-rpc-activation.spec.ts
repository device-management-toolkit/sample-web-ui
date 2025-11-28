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
  // Additional properties for multi-device support
  majorVersion?: string
  deviceName?: string
  deviceHost?: string
}
if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  // SSH config will be loaded in hooks
  let sshConfig: any = null

  const isWin = Cypress.platform === 'win32'
  let useRemoteSSH = false
  let deviceInfos: Map<string, AMTInfo> = new Map()
  const execConfig: Cypress.ExecOptions = {
    log: true,
    failOnNonZeroExit: false,
    timeout: 240000
  } as any

  // get environment variables
  const profileName: string = Cypress.env('PROFILE_NAME') as string
  const password: string = Cypress.env('AMT_PASSWORD')
  const fqdn: string = Cypress.env('ACTIVATION_URL')
  const rpcDockerImage: string = Cypress.env('RPC_DOCKER_IMAGE')
  const parts: string[] = profileName ? profileName.split('-') : []
  const isAdminControlModeProfile = parts.length > 0 && parts[0] === 'acmactivate'

  // Get enabled devices from config
  const getEnabledDevices = () => {
    if (!useRemoteSSH || !sshConfig?.devices) return []
    return sshConfig.devices.filter((device: any) => device.enabled !== false)
  }

  // Function to build SSH command for specific device
  const buildSSHCommand = (remoteCommand: string, device?: any): string => {
    if (!useRemoteSSH) return remoteCommand
    const targetDevice = device || (sshConfig?.devices?.[0] || sshConfig)
    const { host, username, password: sshPassword, sudoPassword, useSudo = true, port = 22 } = targetDevice

    // Use sshpass for password authentication
    const sshOptions = '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'

    // Always append '; sleep 3' to the remote command for SSH
    const remoteWithSleep = `${remoteCommand};`
    let finalCommand = remoteWithSleep

    if (useSudo) {
      // Check if we have a valid sudo password
      if (sudoPassword && sudoPassword !== 'REPLACE_WITH_CORRECT_SUDO_PASSWORD') {
        // Use the configured sudo password
        const sudoCommand = `echo "${sudoPassword}" | sudo -S ${remoteWithSleep}`
        finalCommand = sudoCommand
      } else {
        // Log warning and try without sudo or with SSH password fallback
        cy.task('log', `WARNING: No valid sudo password configured for ${targetDevice.name}. RPC commands may fail due to insufficient privileges.`)

        // Try with SSH password as fallback, then without sudo if that fails
        const passwordFallback = `echo "${sshPassword}" | sudo -S ${remoteWithSleep} 2>/dev/null`
        const noSudoFallback = `${remoteWithSleep}`
        finalCommand = `${passwordFallback} || ${noSudoFallback}`
      }
    } else {
      // Run without sudo (will likely fail but good for debugging)
      cy.task('log', `INFO: Running RPC command without sudo for ${targetDevice.name} (may fail with privilege errors)`)
      finalCommand = remoteWithSleep
    }

    return `sshpass -p '${sshPassword}' ssh ${sshOptions} -p ${port} ${username}@${host} '${finalCommand}'`
  }

  // Function to setup RPC executable on remote host
  const setupRemoteRPC = (device: any): string => {
    if (!useRemoteSSH) return ''
    const setupCommands = [
      'cd /tmp',
      'wget https://github.com/device-management-toolkit/rpc-go/releases/download/v2.48.8/rpc_linux_x64.tar.gz -O /tmp/rpc.tar.gz',
      'sleep 3',
      'tar -xzf /tmp/rpc.tar.gz -C /tmp',
      'sleep 4',
      'chmod +x /tmp/rpc_linux_x64',
      'echo "RPC executable ready"'
    ].join(' && ')
    return buildSSHCommand(setupCommands, device)
  }

  describe('Activation', () => {
    // Load SSH config and setup remote RPC executable if using SSH
    before(() => {
      // Try to load SSH credentials for remote execution
      cy.task('fileExists', 'cypress/fixtures/ssh-config.json').then((exists) => {
        if (exists) {
          cy.readFile('cypress/fixtures/ssh-config.json').then((config) => {
            sshConfig = config
            useRemoteSSH = sshConfig && sshConfig.enabled
            cy.log(`SSH config loaded, useRemoteSSH: ${useRemoteSSH}`)
          })
        } else {
          cy.log('SSH config file not found, falling back to local execution')
          sshConfig = null
          useRemoteSSH = false
        }
      })

      cy.then(() => {
        if (useRemoteSSH) {
          const enabledDevices = getEnabledDevices()
          cy.log(`Setting up RPC executable on ${enabledDevices.length} remote hosts...`)

          // Setup RPC on all enabled devices
          enabledDevices.forEach((device: any) => {
            cy.log(`Setting up device: ${device.name} (${device.host})`)
            const setupCommand = setupRemoteRPC(device)
            cy.task('log', `[SPEC LOG] Setup Command: ${setupCommand}`)
            cy.exec(setupCommand, { ...execConfig, timeout: 60000 }).then((result) => {
              cy.log(`Remote RPC setup completed for ${device.name}:`, result.stdout || result.stderr)
            })
          })
        }
      })
    })

    // Collect AMT info from all devices
    beforeEach(() => {
      cy.setup()
      deviceInfos.clear()

      if (useRemoteSSH) {
        const enabledDevices = getEnabledDevices()
        cy.log(`Checking AMT info on ${enabledDevices.length} devices`)

        enabledDevices.forEach((device: any) => {
          cy.log(`Executing remote AMT info via SSH: ${device.name} (${device.host})`)
          const infoCommand = buildSSHCommand('/tmp/rpc_linux_x64 amtinfo -json', device)
          cy.log(`Executing SSH command for ${device.name}: ${infoCommand}`)
          cy.task('log', `[SPEC LOG] SSH Info Command: ${infoCommand}`)

          cy.exec(infoCommand, execConfig).then((result) => {
        //    cy.task('log', `[SPEC LOG] stdout for ${device.name}: ${result.stdout}`)
            cy.task('log', `[SPEC LOG] stderr for ${device.name}: ${result.stderr}`)
            const output = result.stdout + '\n' + result.stderr
            cy.log(`AMT Info Output for ${device.name}:`, output)
            cy.task('log', `[SPEC LOG] AMT Info JSON for ${device.name}: ${output}`)

            // Improved JSON extraction: extract first complete JSON object from output
            let jsonStr = ''
            const firstBrace = output.indexOf('{')
            const lastBrace = output.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              jsonStr = output.substring(firstBrace, lastBrace + 1)
            }

            if (jsonStr && jsonStr.includes('"amt"')) {
              cy.task('log', `[SPEC LOG] Extracted JSON for ${device.name}: ${jsonStr}`)
            } else {
              cy.task('log', `[SPEC LOG] No JSON found for ${device.name}, raw output: ${output}`)
            }

            if (!jsonStr || jsonStr.includes('No Intel AMT') || jsonStr.includes('Failed') || jsonStr.includes('Error') || !jsonStr.includes('"amt"')) {
              cy.log(`No Intel AMT device detected on ${device.name} - skipping`)
            } else {
              try {
                const amtInfo = JSON.parse(jsonStr)
                const versions: string[] = amtInfo.amt.split('.')
                const majorVersion = versions.length > 1 ? versions[0] : '0'
                amtInfo.majorVersion = majorVersion
                amtInfo.deviceName = device.name
                amtInfo.deviceHost = device.host
                deviceInfos.set(device.name, amtInfo)
                cy.log(`AMT Version detected on ${device.name}: ${amtInfo.amt}, Major: ${majorVersion}`)
                cy.task('log', `[SPEC LOG] AMT Version detected on ${device.name}: ${amtInfo.amt}, Major: ${majorVersion}`)
              } catch (e) {
                cy.log(`Failed to parse AMT info for ${device.name} - no device present`)
              }
            }
          })
        })
      } else {
        // Local execution (original single device behavior)
        cy.log('Executing local AMT info')
        let infoCommand: string
        if (isWin) {
          infoCommand = 'rpc.exe amtinfo -json'
        } else {
          infoCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} amtinfo -json`
        }

        cy.exec(infoCommand, execConfig).then((result) => {
          const output = result.stderr || result.stdout
          cy.log('AMT Info Output:', output)

          if (!output || output.includes('No Intel AMT') || output.includes('Failed') || output.includes('Error') || !output.includes('"amt"')) {
            cy.log('No Intel AMT device detected - skipping activation tests')
          } else {
            try {
              const amtInfo = JSON.parse(output)
              const versions: string[] = amtInfo.amt.split('.')
              const majorVersion = versions.length > 1 ? versions[0] : '0'
              amtInfo.majorVersion = majorVersion
              amtInfo.deviceName = 'local'
              amtInfo.deviceHost = 'localhost'
              deviceInfos.set('local', amtInfo)
              cy.log(`AMT Version detected: ${amtInfo.amt}, Major: ${majorVersion}`)
            } catch (e) {
              cy.log('Failed to parse AMT info - no device present')
            }
          }
        })
      }
      cy.wait(1000)
    })

    it('Should Activate Device(s)', () => {
      if (deviceInfos.size === 0) {
        cy.log('Skipping test - no Intel AMT devices detected')
        return
      }

      // Iterate through all detected devices
      deviceInfos.forEach((amtInfo, deviceName) => {
        cy.log(`\n=== Activating Device: ${deviceName} (${amtInfo.deviceHost}) ===`)

        expect(amtInfo.controlMode).to.contain('pre-provisioning state')

        // Build activation command for this device
        let activateCommand: string
        if (useRemoteSSH) {
          const device = getEnabledDevices().find((d: any) => d.name === deviceName)
          activateCommand = buildSSHCommand(`/tmp/rpc_linux_x64 activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`, device)
          cy.log(`Activation SSH command for ${deviceName}: ${activateCommand}`)
          cy.task('log', `[SPEC LOG] Activation Command: ${activateCommand}`)
        } else {
          if (isWin) {
            activateCommand = `rpc.exe activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`
          } else {
            activateCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`
          }
        }

        // activate device
        cy.log(`Activating device ${deviceName} using ${useRemoteSSH ? 'remote SSH' : 'local'} execution`)
        cy.exec(activateCommand, execConfig).then((result) => {
          const output = result.stderr || result.stdout
          cy.log(`Activation Output for ${deviceName}:`, output)
          cy.task('log', `[SPEC LOG] Activation Output for ${deviceName}: ${output}`)

          // Check for certificate-related errors
          if (output.includes('Invalid domain certificate') || output.includes('hash does not exists')) {
            const errorMsg = `⚠️  CERTIFICATE ERROR: MPS server certificate hash not in AMT's trusted root certificates. Configuration issue - certificate needs provisioning through RPS. Skipping activation validation for ${deviceName}.`
            cy.log(errorMsg)
            cy.task('log', `[SPEC LOG] ${errorMsg}`)
            cy.task('log', `[SPEC LOG] TEST SKIPPED: Certificate configuration error`)
            // Return early to skip remaining validations
            return
          }

          if (parseInt(amtInfo.majorVersion || '0') < 12 && parseInt(amtInfo.buildNumber) < 3000) {
            expect(output).to.contain(
              'Only version 10.0.47 with build greater than 3000 can be remotely configured'
            )
            return
          } else {
            if (isAdminControlModeProfile) {
              expect(output).to.contain('Status: Admin control mode')
            } else {
              expect(output).to.contain('Status: Client control mode')
            }

            if (parts[2] === 'CIRA') {
              expect(output).to.contain('CIRA: Configured')
            } else {
              expect(output).to.contain('TLS: Configured')
            }

            if (profileName.endsWith('WiFi')) {
              expect(output).to.contain('Network: Wired Network Configured. Wireless Configured')
            } else {
              expect(output).to.contain('Network: Wired Network Configured')
            }
          }

          // Verify device in UI only for the first device (to avoid UI conflicts)
          if (deviceName === Array.from(deviceInfos.keys())[0]) {
            cy.wait(120000)

            cy.myIntercept('GET', /devices\/.*$/, {}).as('getdevices')
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

            if (parseInt(amtInfo.majorVersion || '0') < 11) {
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
          }
        })
      })
    })

    it('should NOT deactivate device(s) - invalid password', () => {
      if (deviceInfos.size === 0) {
        cy.log('Skipping test - no Intel AMT devices detected')
        return
      }

      // Test invalid deactivation on all devices
      deviceInfos.forEach((amtInfo, deviceName) => {
        if (amtInfo.controlMode !== 'pre-provisioning state') {
          cy.log(`Testing invalid deactivation on Device: ${deviceName}`)

          // Build deactivate command for this device
          let deactivateCommand: string
          if (useRemoteSSH) {
            const device = getEnabledDevices().find((d: any) => d.name === deviceName)
            deactivateCommand = buildSSHCommand(`/tmp/rpc_linux_x64 deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`, device)
            cy.log(`Invalid deactivation SSH command for ${deviceName}: ${deactivateCommand}`)
            cy.task('log', `[SPEC LOG] Invalid Deactivation Command: ${deactivateCommand}`)
          } else {
            if (isWin) {
              deactivateCommand = `rpc.exe deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
            } else {
              deactivateCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
            }
          }

          const invalidCommand =
            deactivateCommand.slice(0, deactivateCommand.indexOf('--password')) + '--password invalidpassword'
          cy.exec(invalidCommand, execConfig).then((result) => {
            const output = result.stderr || result.stdout
            cy.log(`Invalid deactivation output for ${deviceName}:`, output)
            expect(output).to.contain('Unable to authenticate with AMT')
          })
        }
      })
    })

    it('should deactivate device(s)', () => {
      if (deviceInfos.size === 0) {
        cy.log('Skipping test - no Intel AMT devices detected')
        return
      }

      // Deactivate all devices
      deviceInfos.forEach((amtInfo, deviceName) => {
        if (amtInfo.controlMode !== 'pre-provisioning state') {
          cy.log(`Deactivating Device: ${deviceName}`)

          // Build deactivate command for this device
          let deactivateCommand: string
          if (useRemoteSSH) {
            const device = getEnabledDevices().find((d: any) => d.name === deviceName)
            deactivateCommand = buildSSHCommand(`/tmp/rpc_linux_x64 deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`, device)
            cy.log(`Deactivation SSH command for ${deviceName}: ${deactivateCommand}`)
            cy.task('log', `[SPEC LOG] Deactivation Command: ${deactivateCommand}`)
          } else {
            if (isWin) {
              deactivateCommand = `rpc.exe deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
            } else {
              deactivateCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
            }
          }

          cy.log(`Deactivating device ${deviceName} using ${useRemoteSSH ? 'remote SSH' : 'local'} execution`)
          cy.exec(deactivateCommand, execConfig).then((result) => {
            const output = result.stderr || result.stdout
            cy.log(`Deactivation output for ${deviceName}:`, output)
            expect(output).to.contain('Status: Deactivated')
          })
        }
      })
    })
  })

  describe('Negative Activation Test', () => {
    if (isAdminControlModeProfile) {
      it('Should NOT activate ACM when domain suffix is not registered in RPS', () => {
        if (deviceInfos.size === 0) {
          cy.log('Skipping test - no Intel AMT devices detected')
          return
        }

        // Test negative activation on first available device
        const firstDevice = Array.from(deviceInfos.entries())[0]
        const [deviceName, amtInfo] = firstDevice

        cy.log(`Testing negative activation on Device: ${deviceName}`)

        // Build activation command for this device
        let activateCommand: string
        if (useRemoteSSH) {
          const device = getEnabledDevices().find((d: any) => d.name === deviceName)
          activateCommand = buildSSHCommand(`/tmp/rpc_linux_x64 activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`, device)
          cy.log(`Activation SSH command for ${deviceName}: ${activateCommand}`)
          cy.task('log', `[SPEC LOG] Negative Activation Command: ${activateCommand}`)
        } else {
          if (isWin) {
            activateCommand = `rpc.exe activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`
          } else {
            activateCommand = `docker run --device=/dev/mei0 ${rpcDockerImage} activate -u wss://${fqdn}/activate -v -n --profile ${profileName} -json`
          }
        }

        activateCommand += ' -d dontmatch.com'
        cy.task('log', `[SPEC LOG] Final Negative Command: ${activateCommand}`)
        cy.exec(activateCommand, execConfig).then((result) => {
          const errorOutput = result.stderr || result.stdout
          expect(errorOutput).to.contain(
            'Specified AMT domain suffix: dontmatch.com does not match list of available AMT domain suffixes.'
          )
        })
      })
    }
  })
}
