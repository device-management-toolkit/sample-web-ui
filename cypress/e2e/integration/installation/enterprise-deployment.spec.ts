/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests for enterprise deployment installation and setup
// Supports both Windows and Linux platforms
// Tests console application deployment and login

describe('Enterprise Deployment', () => {
  context('TC_INSTALL_DEPLOY_CONSOLE', () => {
    // Store credentials and port for use in test
    let consoleUsername = 'admin'
    let consolePassword = 'admin'
    let consolePort = '8181'
    
    before(() => {
      cy.task('log', '=== Starting Fresh Installation Test ===')
      
      // Detect platform first
      const isWindows = Cypress.platform === 'win32'
      const detectedOS = isWindows ? 'Windows' : 'Linux'
      
      // Platform-specific paths and commands
      const tempDir = isWindows ? 'C:\\temp' : '/tmp'
      const markerFile = `${tempDir}/cypress-console-setup-done`
      
      // Check for setup marker first
      let setupAlreadyDone = false
      
      const checkMarkerCmd = isWindows
        ? `if exist "${markerFile}" (echo done) else (echo not done)`
        : `test -f ${markerFile} && echo "done" || echo "not done"`
      
      cy.exec(checkMarkerCmd, {
        timeout: 5000,
        failOnNonZeroExit: false
      }).then((markerCheck) => {
        setupAlreadyDone = markerCheck.stdout.trim() === 'done'
        
        if (!setupAlreadyDone) {
          // First execution - verify this is truly a fresh installation
          const processCheckCmd = isWindows
            ? 'tasklist /FI "IMAGENAME eq console_windows_x64.exe" /NH 2>nul || tasklist /FI "IMAGENAME eq console.exe" /NH 2>nul'
            : 'pgrep -f "console_linux_x64.*serve"'
          
          cy.exec(processCheckCmd, {
            timeout: 5000,
            failOnNonZeroExit: false
          }).then((processCheck) => {
            // Check if console process is running
            const hasProcess = isWindows
              ? (processCheck.stdout.includes('console.exe') || processCheck.stdout.includes('console_windows_x64.exe'))
              : processCheck.stdout && processCheck.stdout.trim() !== ''
            
            if (hasProcess) {
              // Console is running - this is NOT a fresh installation!
              cy.task('log', 'ERROR: Console is already running! This is not a fresh installation.')
              cy.then(() => {
                throw new Error('Fresh installation test failed: Console already running')
              })
            } else {
              cy.task('log', 'Verified: No console running (fresh system)')
              
              // Proceed with fresh installation
              cy.task('log', 'Starting fresh installation setup...')
          
          // Configure based on platform
          const customConsoleUrl = Cypress.env('CONSOLE_DOWNLOAD_URL')
          const version = customConsoleUrl ? '' : 'latest'
          
          let consoleUrl = ''
          let archiveFile = ''
          let extractCmd = ''
          let consolePath = ''
          
          if (isWindows) {
            consoleUrl = customConsoleUrl || `https://github.com/device-management-toolkit/console/releases/${version}/download/console_windows_x64.exe`
            archiveFile = 'console_windows_x64.exe'
            extractCmd = '' // No extraction needed for Windows .exe
            consolePath = `${tempDir}\\${archiveFile}`
          } else {
            consoleUrl = customConsoleUrl || `https://github.com/device-management-toolkit/console/releases/${version}/download/console_linux_x64.tar.gz`
            archiveFile = 'console_linux_x64.tar.gz'
            extractCmd = `tar -xzf ${tempDir}/${archiveFile} -C ${tempDir}`
            consolePath = `${tempDir}/dist/linux/console_linux_x64`
          }
          
          cy.task('log', `Detected Platform: ${detectedOS}`)
          
          // Check if binary already exists (skip download if already downloaded)
          const checkBinaryCmd = isWindows
            ? `if exist "${consolePath}" (echo exists) else (echo not found)`
            : `test -f ${consolePath} && echo "exists" || echo "not found"`
          
          cy.exec(checkBinaryCmd, { 
            timeout: 5000,
            failOnNonZeroExit: false 
          }).then((result) => {
            if (result.stdout.includes('exists')) {
              cy.task('log', '✓ Console binary already exists, skipping download')
            } else {
              cy.task('log', `Downloading console from: ${consoleUrl}`)
              
              // Download console binary/archive
              const downloadPath = isWindows ? `${tempDir}\\${archiveFile}` : `${tempDir}/${archiveFile}`
              const curlCmd = isWindows ? `curl.exe -L -o ${downloadPath} ${consoleUrl}` : `curl -L -o ${downloadPath} ${consoleUrl}`
              cy.exec(curlCmd, { timeout: 120000 })
              cy.task('log', isWindows ? '✓ Console binary downloaded' : '✓ Console archive downloaded')
              
              // Extract archive (Linux only)
              if (!isWindows && extractCmd) {
                cy.exec(extractCmd, { timeout: 30000 })
                cy.task('log', '✓ Console archive extracted')
              }
              
              // Make executable on Linux
              if (!isWindows) {
                cy.exec(`chmod +x ${consolePath}`)
                cy.task('log', '✓ Console binary made executable')
              }
            }
            
            // Verify console is executable
            const verifyCmd = isWindows ? `dir "${consolePath}"` : `ls -la ${consolePath}`
            cy.exec(verifyCmd, { timeout: 10000 })
            cy.task('log', '✓ Console binary verified')
          })
          
          // Start console application in background (it will use config file port)
          cy.task('log', `Starting console application...`)
          
          // Kill any existing console process first
          const killCmd = isWindows
            ? 'taskkill /F /IM console_windows_x64.exe /T 2>nul || taskkill /F /IM console.exe /T 2>nul || exit 0'
            : 'pkill -f console_linux_x64 || true'
          cy.exec(killCmd, { failOnNonZeroExit: false })
          
          // Start console in background using Windows Task Scheduler for reliable detachment
          const logFile = `${tempDir}\\console.log`
          
          if (isWindows) {
            // Delete any existing task
            cy.exec('schtasks /Delete /TN "CypressConsole" /F', { failOnNonZeroExit: false, timeout: 5000 })
            
            // Create a scheduled task that runs immediately
            const createTaskCmd = `schtasks /Create /TN "CypressConsole" /TR "cmd /c cd /D ${tempDir} && console_windows_x64.exe serve > console.log 2>&1" /SC ONCE /ST 00:00 /F`
            cy.exec(createTaskCmd, { timeout: 5000 })
            
            // Run the task immediately
            cy.exec('schtasks /Run /TN "CypressConsole"', { timeout: 5000 })
            cy.task('log', '✓ Console application started via task scheduler')
          } else {
            const startCmd = `nohup sh -c "cd ${tempDir} && ./console_linux_x64 serve > console.log 2>&1 &"`
            cy.exec(startCmd, { timeout: 10000, failOnNonZeroExit: false })
            cy.task('log', '✓ Console application started')
          }
          
          // Wait for console to be ready (needs time for TLS cert generation and server startup)
          cy.wait(15000)
          cy.task('log', '✓ Waiting for console to initialize...')
          
          // Create marker file after successful setup
          const createMarkerCmd = isWindows
            ? `type nul > "${markerFile}"`
            : `touch ${markerFile}`
          cy.exec(createMarkerCmd)
          cy.task('log', '✓ Setup marker created')
            }
          })
        } else {
          // Second execution - setup already done by first execution
          cy.task('log', '✓ Setup already completed in first execution, proceeding with test')
        }
      })
      
      // Read credentials from config file (runs in both executions so variables are set for test)
      const configPath = isWindows ? `${tempDir}\\config` : `${tempDir}/dist/linux/config`
      const configFile = `${configPath}${isWindows ? '\\' : '/'}config.yml`
      
      const checkConfigCmd = isWindows
        ? `if exist "${configPath}" (echo exists) else (echo not found)`
        : `test -d ${configPath} && echo "exists" || echo "not found"`
      
      cy.exec(checkConfigCmd, { 
        timeout: 5000,
        failOnNonZeroExit: false 
      }).then((result) => {
        if (result.stdout.includes('exists')) {
          const readCmd = isWindows ? `type "${configFile}"` : `cat ${configFile}`
          cy.exec(readCmd, { failOnNonZeroExit: false }).then((result) => {
            if (result.stdout) {
              // Parse YAML to extract port, adminUsername and adminPassword  
              const portMatch = result.stdout.match(/port:\s*"?(\d+)"?/)
              const usernameMatch = result.stdout.match(/adminUsername:\s*(.+)/)
              const passwordMatch = result.stdout.match(/adminPassword:\s*(.+)/)
              
              if (portMatch && portMatch[1]) {
                consolePort = portMatch[1].trim()
              }
              if (usernameMatch && usernameMatch[1]) {
                consoleUsername = usernameMatch[1].trim()
              }
              if (passwordMatch && passwordMatch[1]) {
                consolePassword = passwordMatch[1].trim()
              }
              // Only log during first execution when setup was just done
              if (!setupAlreadyDone) {
                cy.task('log', `✓ Config loaded - Port: ${consolePort}, Username: ${consoleUsername}`)
              }
            }
          })
        }
      })
    })
    
    it('should successfully deploy fresh installation', { retries: 0 }, () => {
      // Visit console application using port from config file
      const consoleAppUrl = Cypress.env('CONSOLE_URL') || `https://localhost:${consolePort}`
      
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
        
        cy.task('log', '=== Fresh Installation Test Completed ===')
    })
  })
})
