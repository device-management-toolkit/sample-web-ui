/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests for enterprise deployment installation and setup
// Supports both Windows and Linux platforms
// Tests console application deployment and login

describe('Enterprise Deployment', () => {
  context('TC_INSTALL_DEPLOY_CONSOLE', () => {
    // Store credentials for use in test
    let consoleUsername = 'admin'
    let consolePassword = 'admin'
    
    before(() => {
      cy.task('log', '=== Starting Fresh Installation Test ===')
      
      // Check for setup marker first
      let setupAlreadyDone = false
      
      cy.exec('test -f /tmp/cypress-console-setup-done && echo "done" || echo "not done"', {
        timeout: 5000,
        failOnNonZeroExit: false
      }).then((markerCheck) => {
        setupAlreadyDone = markerCheck.stdout.trim() === 'done'
        
        if (!setupAlreadyDone) {
          // First execution - verify this is truly a fresh installation
          cy.exec('pgrep -f "console_linux_x64.*serve"', {
            timeout: 5000,
            failOnNonZeroExit: false
          }).then((processCheck) => {
            // If stdout is not empty, process is found (console is running)
            if (processCheck.stdout && processCheck.stdout.trim() !== '') {
              // Console is running - this is NOT a fresh installation!
              cy.task('log', '❌ ERROR: Console is already running! This is not a fresh installation.')
              cy.task('log', 'Please stop the console process before running fresh installation test.')
              cy.then(() => {
                throw new Error('Fresh installation test failed: Console already running')
              })
            } else {
              cy.task('log', '✓ Verified: No console running (fresh system)')
              
              // Proceed with fresh installation
              cy.task('log', '🔧 Starting fresh installation setup...')
          
          // Detect platform synchronously using Cypress.platform
          const isWindows = Cypress.platform === 'win32'
          const detectedOS = isWindows ? 'Windows' : 'Linux'
          
          // Configure based on platform
          const customConsoleUrl = Cypress.env('CONSOLE_DOWNLOAD_URL')
          const version = customConsoleUrl ? '' : 'latest'
          
          let consoleUrl = ''
          let archiveFile = ''
          let extractCmd = ''
          let consolePath = ''
          
          if (isWindows) {
            consoleUrl = customConsoleUrl || `https://github.com/device-management-toolkit/console/releases/${version}/download/console_windows_x64.zip`
            archiveFile = 'console_windows_x64.zip'
            extractCmd = 'unzip -o /tmp/console_windows_x64.zip -d /tmp/console_extract'
            consolePath = '/tmp/console_extract/console.exe'
          } else {
            consoleUrl = customConsoleUrl || `https://github.com/device-management-toolkit/console/releases/${version}/download/console_linux_x64.tar.gz`
            archiveFile = 'console_linux_x64.tar.gz'
            extractCmd = 'tar -xzf /tmp/console_linux_x64.tar.gz -C /tmp'
            consolePath = '/tmp/dist/linux/console_linux_x64'
          }
          
          cy.task('log', `Detected Platform: ${detectedOS}`)
          
          // Check if binary already exists (skip download if already downloaded)
          cy.exec(`test -f ${consolePath} && echo "exists" || echo "not found"`, { 
            timeout: 5000,
            failOnNonZeroExit: false 
          }).then((result) => {
            if (result.stdout.includes('exists')) {
              cy.task('log', '✓ Console binary already exists, skipping download')
            } else {
              cy.task('log', `Downloading console from: ${consoleUrl}`)
              
              // Download console archive
              cy.exec(`curl -L -o /tmp/${archiveFile} ${consoleUrl}`, { timeout: 60000 })
              cy.task('log', '✓ Console archive downloaded')
              
              // Extract archive
              cy.exec(extractCmd, { timeout: 30000 })
              cy.task('log', '✓ Console archive extracted')
              
              // Make executable on Linux
              if (!isWindows) {
                cy.exec(`chmod +x ${consolePath}`)
                cy.task('log', '✓ Console binary made executable')
              }
            }
            
            // Verify console is executable
            cy.exec(`ls -la ${consolePath}`, { timeout: 10000 })
            cy.task('log', '✓ Console binary verified')
          })
          
          // Start console application in background
          const consolePort = Cypress.env('CONSOLE_PORT') || '8181'
          cy.task('log', `Starting console application on port ${consolePort}...`)
          
          // Kill any existing console process first
          cy.exec(`pkill -f console_linux_x64 || true`, { failOnNonZeroExit: false })
          
          // Start console in background with auto-accept for key generation
          cy.exec(`nohup sh -c "echo 'Y' | BROWSER=none ${consolePath} serve --port ${consolePort} > /tmp/console.log 2>&1 &"`, { 
            timeout: 10000,
            failOnNonZeroExit: false 
          })
          cy.task('log', '✓ Console application started')
          
          // Wait for console to be ready (needs time for TLS cert generation and server startup)
          cy.wait(10000)
          cy.task('log', '✓ Waiting for console to initialize...')
          
          // Create marker file after successful setup
          cy.exec('touch /tmp/cypress-console-setup-done')
          cy.task('log', '✓ Setup marker created')
            }
          })
        } else {
          // Second execution - setup already done by first execution
          cy.task('log', '✓ Setup already completed in first execution, proceeding with test')
        }
      })
      
      // Read credentials from config file (runs in both executions so variables are set for test)
      const isWindows = Cypress.platform === 'win32'
      const configPath = isWindows ? '/tmp/console_extract/config' : '/tmp/dist/linux/config'
      const configFile = `${configPath}/config.yml`
      
      cy.exec(`test -d ${configPath} && echo "exists" || echo "not found"`, { 
        timeout: 5000,
        failOnNonZeroExit: false 
      }).then((result) => {
        if (result.stdout.includes('exists')) {
          cy.exec(`cat ${configFile}`, { failOnNonZeroExit: false }).then((result) => {
            if (result.stdout) {
              // Parse YAML to extract adminUsername and adminPassword  
              const usernameMatch = result.stdout.match(/adminUsername:\s*(.+)/)
              const passwordMatch = result.stdout.match(/adminPassword:\s*(.+)/)
              
              if (usernameMatch && usernameMatch[1]) {
                consoleUsername = usernameMatch[1].trim()
              }
              if (passwordMatch && passwordMatch[1]) {
                consolePassword = passwordMatch[1].trim()
              }
              // Only log during first execution when setup was just done
              if (!setupAlreadyDone) {
                cy.task('log', `✓ Credentials loaded - Username: ${consoleUsername}`)
              }
            }
          })
        }
      })
    })
    
    it('should successfully deploy fresh installation', { retries: 0 }, () => {
      // Visit console application
      const consoleAppUrl = Cypress.env('CONSOLE_URL') || 'https://localhost:8181'
      
      cy.visit(consoleAppUrl, { failOnStatusCode: false })
      cy.task('log', `✓ Console application accessible at ${consoleAppUrl}`)
      
      // Wait for Angular app to bootstrap (SPA needs time to load and render)
      cy.get('app-root', { timeout: 15000 }).should('exist')
      cy.task('log', '✓ Angular app root loaded')
      
      // Additional wait for Angular components to fully render (increased for first-try success)
      cy.wait(8000)
      
      // Verify login page elements with very long timeout for Angular to render
      cy.get('input[type="text"], input[type="email"], mat-form-field input', { timeout: 30000 }).first().should('be.visible')
      cy.get('input[type="password"], mat-form-field input[type="password"]', { timeout: 10000 }).should('be.visible')
      cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign in"), button:contains("SIGN IN")', { timeout: 10000 }).first().should('be.visible')
      cy.task('log', '✓ Console login page verified')
      
      // Authenticate to console using credentials from config.yml
      cy.task('log', `Logging in with Username: ${consoleUsername}`)
      
      cy.get('input[type="text"], input[type="email"], mat-form-field input').first().clear().type(consoleUsername)
      cy.get('input[type="password"], mat-form-field input[type="password"]').clear().type(consolePassword)
        cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign in"), button:contains("SIGN IN")').first().click()
        cy.task('log', '✓ Console authentication submitted')
        
        // Verify successful login (check for dashboard or home page elements)
        cy.url({ timeout: 10000 }).should('not.include', '/login')
        cy.task('log', '✓ Console login successful')
        
        // Verify console dashboard/home page
        cy.get('body').should('be.visible')
        cy.task('log', '✓ Console dashboard accessible')
        
      // Cleanup: Stop console application and remove marker file
      cy.exec('pkill -f console_linux_x64 || true', { failOnNonZeroExit: false })
      cy.exec('rm -f /tmp/cypress-console-setup-done', { failOnNonZeroExit: false })
      cy.task('log', '✓ Console application stopped')
      
      cy.task('log', '=== Fresh Installation Test Completed ===')
    })
  })
})
