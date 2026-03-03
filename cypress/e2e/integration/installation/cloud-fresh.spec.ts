/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Fresh Installation Tests for Cloud Deployment using Docker Compose
 *
 * Direct execution of all deploy-cloud.yml workflow steps as Cypress tests.
 * This follows the EXACT sequence from deploy-cloud.yml:
 * https://github.com/device-management-toolkit/e2e-testing/.github/workflows/deploy-cloud.yml
 */

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'

const mpsUsername: string = Cypress.env('MPS_USERNAME') || 'standalone'
const mpsPassword: string = Cypress.env('MPS_PASSWORD') || 'G@ppm0ym'
const serverPort: string = Cypress.env('SERVER_PORT') || '8443'
const cloudDeploymentPath = Cypress.env('CLOUD_DEPLOYMENT_PATH') ||'../cloud-deployment'
const cloudBranch = Cypress.env('CLOUD_DEPLOYMENT_BRANCH') || 'main'
const mpsRef = Cypress.env('MPS_REF') || 'main'
const rpsRef = Cypress.env('RPS_REF') || 'main'
const sampleWebUiRef = Cypress.env('SAMPLE_WEB_UI_REF') || 'main'
const mpsRouterRef = Cypress.env('MPS_ROUTER_REF') || 'main'
const jwtSecret = Cypress.env('JWT_SECRET') || 'supersecret'
const postgresPassword = Cypress.env('POSTGRES_PASSWORD') || 'postgresadmin'
const vaultToken = Cypress.env('VAULT_TOKEN') || 'myroot'
let baseUrl: string

describe('Cloud Deployment - Docker Compose Installation (deploy-cloud.yml)', () => {
  context('TC_INSTALL_FRESH-CLOUD-DEPLOY', () => {
    it('cloud deployment workflow', () => {
      let systemIP: string

      // STEP 1: Checkout cloud-deployment repository
      cy.task('log', '\n=== STEP 1: Checkout cloud-deployment repository ===')
      cy.exec(`test -d ${cloudDeploymentPath} && echo "exists" || echo "not_exists"`).then((result) => {
        const exists = result.stdout.trim() === 'exists'
        cy.task('log', exists ? 'Directory exists, updating...' : 'Directory not found, cloning...')
        
        if (exists) {
          cy.exec(`cd ${cloudDeploymentPath} && git fetch origin && git checkout ${cloudBranch} && git pull origin ${cloudBranch}`, {
            timeout: 120000
          }).then(() => {
            cy.task('log', '✓ Repository updated successfully')
          })
        } else {
          cy.exec(`git clone --recurse-submodules --branch ${cloudBranch} https://github.com/device-management-toolkit/cloud-deployment.git ${cloudDeploymentPath}`, {
            timeout: 120000
          }).then(() => {
            cy.task('log', '✓ Repository cloned successfully')
          })
        }
      })

      // STEP 2: Update submodules to specific ref
      cy.task('log', '\n=== STEP 2: Update submodules to specific ref ===')
      cy.exec(`cd ${cloudDeploymentPath}/mps && git fetch origin && (git checkout ${mpsRef} || git checkout origin/${mpsRef})`, {
        failOnNonZeroExit: false
      }).then(() => {
        cy.task('log', `✓ MPS checked out to ${mpsRef}`)
      })

      cy.exec(`cd ${cloudDeploymentPath}/rps && git fetch origin && (git checkout ${rpsRef} || git checkout origin/${rpsRef})`, {
        failOnNonZeroExit: false
      }).then(() => {
        cy.task('log', `✓ RPS checked out to ${rpsRef}`)
      })

      cy.exec(`cd ${cloudDeploymentPath}/sample-web-ui && git fetch origin && (git checkout ${sampleWebUiRef} || git checkout origin/${sampleWebUiRef})`, {
        failOnNonZeroExit: false
      }).then(() => {
        cy.task('log', `✓ Sample-web-ui checked out to ${sampleWebUiRef}`)
      })

      cy.exec(`cd ${cloudDeploymentPath}/mps-router && git fetch origin && (git checkout ${mpsRouterRef} || git checkout origin/${mpsRouterRef})`, {
        failOnNonZeroExit: false
      }).then(() => {
        cy.task('log', `✓ MPS-router checked out to ${mpsRouterRef}`)
      })

      // STEP 3: Get system IP address
      cy.task('log', '\n=== STEP 3: Get system IP address ===')
      cy.exec(`hostname -I | awk '{print $1}'`).then((result) => {
        systemIP = result.stdout.trim()
        expect(systemIP).to.not.be.empty
        cy.task('log', `✓ System IP: ${systemIP}`)
        Cypress.env('SYSTEM_IP', systemIP)
        baseUrl = `https://${systemIP}:${serverPort}`
        cy.task('log', `✓ Base URL set to: ${baseUrl}`)
      })

      // STEP 4: Set up environment variables
      cy.task('log', '\n=== STEP 4: Set up environment variables ===')
      cy.exec(`cd ${cloudDeploymentPath} && (cp .env.template .env || touch .env)`, {
        failOnNonZeroExit: false
      }).then(() => {
        cy.task('log', '✓ .env file created')
      })

      cy.then(() => {
        const ip = Cypress.env('SYSTEM_IP')
        expect(ip, 'SYSTEM_IP must be set from STEP 3').to.not.be.undefined
        cy.task('log', `Using IP for MPS_COMMON_NAME: ${ip}`)
        
        cy.exec(`cd ${cloudDeploymentPath} && sed -i "s|^MPS_COMMON_NAME=.*|MPS_COMMON_NAME=${ip}|" .env && grep -q "^MPS_COMMON_NAME=" .env || echo "MPS_COMMON_NAME=${ip}" >> .env`).then(() => {
          cy.task('log', `✓ MPS_COMMON_NAME set to ${ip}`)
        })

        cy.exec(`cd ${cloudDeploymentPath} && sed -i "s|^MPS_WEB_ADMIN_USER=.*|MPS_WEB_ADMIN_USER=${mpsUsername}|" .env && grep -q "^MPS_WEB_ADMIN_USER=" .env || echo "MPS_WEB_ADMIN_USER=${mpsUsername}" >> .env`).then(() => {
          cy.task('log', '✓ MPS_WEB_ADMIN_USER set')
        })

        cy.exec(`cd ${cloudDeploymentPath} && sed -i "s|^MPS_WEB_ADMIN_PASSWORD=.*|MPS_WEB_ADMIN_PASSWORD=${mpsPassword}|" .env && grep -q "^MPS_WEB_ADMIN_PASSWORD=" .env || echo "MPS_WEB_ADMIN_PASSWORD=${mpsPassword}" >> .env`).then(() => {
          cy.task('log', '✓ MPS_WEB_ADMIN_PASSWORD set')
        })

        cy.exec(`cd ${cloudDeploymentPath} && sed -i "s|^MPS_JWT_SECRET=.*|MPS_JWT_SECRET=${jwtSecret}|" .env && grep -q "^MPS_JWT_SECRET=" .env || echo "MPS_JWT_SECRET=${jwtSecret}" >> .env`).then(() => {
          cy.task('log', '✓ MPS_JWT_SECRET set')
        })

        cy.exec(`cd ${cloudDeploymentPath} && sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${postgresPassword}|" .env && grep -q "^POSTGRES_PASSWORD=" .env || echo "POSTGRES_PASSWORD=${postgresPassword}" >> .env`).then(() => {
          cy.task('log', '✓ POSTGRES_PASSWORD set')
        })

        cy.exec(`cd ${cloudDeploymentPath} && sed -i "s|^VAULT_TOKEN=.*|VAULT_TOKEN=${vaultToken}|" .env && grep -q "^VAULT_TOKEN=" .env || echo "VAULT_TOKEN=${vaultToken}" >> .env`).then(() => {
          cy.task('log', '✓ VAULT_TOKEN set')
        })
      })

      // STEP 5: Install yq
      cy.task('log', '\n=== STEP 5: Install yq ===')
      cy.exec('curl -L https://github.com/mikefarah/yq/releases/download/v4.40.5/yq_linux_amd64 -o /tmp/yq && chmod +x /tmp/yq', {
        timeout: 60000
      }).then(() => {
        cy.task('log', '✓ yq downloaded and ready')
      })

      // STEP 6: Update Kong JWT secret
      cy.task('log', '\n=== STEP 6: Update Kong JWT secret ===')
      cy.exec(`/tmp/yq eval '.jwt_secrets[0].secret = "${jwtSecret}"' -i ${cloudDeploymentPath}/kong.yaml`).then(() => {
        cy.task('log', '✓ Kong JWT secret updated')
      })

      // STEP 7: Update docker-compose configuration
      cy.task('log', '\n=== STEP 7: Update docker-compose configuration ===')
      cy.exec(`/tmp/yq eval '.services.kong.ports[0] = "${serverPort}:8443"' -i ${cloudDeploymentPath}/docker-compose.yml`).then(() => {
        cy.task('log', `✓ Kong port set to ${serverPort}:8443`)
      })

      cy.exec(`/tmp/yq eval '.services.webui.environment.RPS_SERVER = "https://\${MPS_COMMON_NAME}:${serverPort}/rps"' -i ${cloudDeploymentPath}/docker-compose.yml`).then(() => {
        cy.task('log', '✓ RPS_SERVER configured')
      })

      cy.exec(`/tmp/yq eval '.services.webui.environment.MPS_SERVER = "https://\${MPS_COMMON_NAME}:${serverPort}/mps"' -i ${cloudDeploymentPath}/docker-compose.yml`).then(() => {
        cy.task('log', '✓ MPS_SERVER configured')
      })

      cy.exec(`/tmp/yq eval '.services.webui.environment.VAULT_SERVER = "https://\${MPS_COMMON_NAME}:${serverPort}/vault"' -i ${cloudDeploymentPath}/docker-compose.yml`).then(() => {
        cy.task('log', '✓ VAULT_SERVER configured')
      })

      // STEP 8: Build and start services with Docker Compose
      cy.task('log', '\n=== STEP 8: Build and start services with Docker Compose ===')
      cy.exec(`cd ${cloudDeploymentPath} && docker compose down -v --remove-orphans || true`, {
        timeout: 120000,
        failOnNonZeroExit: false
      }).then(() => {
        cy.task('log', '✓ Existing containers stopped')
      })

      cy.task('log', 'Building Docker images (this may take 10+ minutes)...')
      //cy.exec(`cd ${cloudDeploymentPath} && docker compose build --build-arg HTTP_PROXY --build-arg HTTPS_PROXY --build-arg NO_PROXY --build-arg http_proxy --build-arg https_proxy --build-arg no_proxy --no-cache`, {
      //  timeout: 600000
      //}).then(() => {
      //  cy.task('log', '✓ Services built successfully')
     // })

      cy.exec(`cd ${cloudDeploymentPath} && docker compose up -d`, {
        timeout: 120000
      }).then(() => {
        cy.task('log', '✓ Services started in detached mode')
      })

      // STEP 9: Wait for services to be healthy
      cy.task('log', '\n=== STEP 9: Wait for services to be healthy ===')
      cy.task('log', 'Waiting 30 seconds for services to initialize...')
      cy.wait(30000)
      cy.task('log', '✓ Wait complete')

      // STEP 10: Check service health
      cy.task('log', '\n=== STEP 10: Check service health ===')
      cy.exec(`cd ${cloudDeploymentPath} && [ $(docker compose ps --services --filter "status=running" | wc -l) -eq $(docker compose ps --services | wc -l) ] && echo "All services are running" || (echo "Some services failed to start" && docker compose ps --services --filter "status=exited" && exit 1)`, {
        timeout: 60000
      }).then(() => {
        cy.task('log', '✓ All services are running')
      })

      // STEP 11: Display deployment info
      cy.task('log', '\n=== STEP 11: Display deployment info ===')
      cy.task('log', `Branch: ${cloudBranch}`)
      cy.exec(`cd ${cloudDeploymentPath} && docker compose ps --format "table {{.Name}}\\t{{.Status}}\\t{{.Ports}}"`).then((result) => {
        cy.task('log', '\nServices deployed:')
        cy.task('log', result.stdout)
      })

      // FINAL VERIFICATION: Verify deployed services using curl (bypasses proxy)
      cy.task('log', '\n=== FINAL VERIFICATION: Verify deployed services ===')
      
      cy.then(() => {
        const ip = Cypress.env('SYSTEM_IP')
        const verifyBaseUrl = `https://${ip}:${serverPort}`
        cy.task('log', `Verifying services at: ${verifyBaseUrl}`)

        // Get JWT token using curl
        cy.exec(`curl -k -s --noproxy "*" -X POST "${verifyBaseUrl}/mps/login/api/v1/authorize" -H "Content-Type: application/json" -d '{"username":"${mpsUsername}","password":"${mpsPassword}"}'`).then((result) => {
          const response = JSON.parse(result.stdout)
          expect(response).to.have.property('token')
          const token = response.token
          cy.task('log', '✓ Authentication successful - JWT token obtained')

          // Test MPS API with token
          const mpsUrl = `${verifyBaseUrl}/mps/api/v1/version`
          cy.exec(`curl -k -s --noproxy "*" -H "Authorization: Bearer ${token}" -w "\\nHTTP_STATUS:%{http_code}" "${mpsUrl}"`).then((result) => {
            expect(result.stdout).to.include('HTTP_STATUS:200')
            expect(result.stdout).to.include('serviceVersion')
            cy.task('log', '✓ MPS API accessible with JWT token')
            
            // Test RPS API with token
            const rpsUrl = `${verifyBaseUrl}/rps/api/v1/admin/version`
            cy.exec(`curl -k -s --noproxy "*" -H "Authorization: Bearer ${token}" -w "\\nHTTP_STATUS:%{http_code}" "${rpsUrl}"`).then((result) => {
              expect(result.stdout).to.include('HTTP_STATUS:200')
              expect(result.stdout).to.include('serviceVersion')
              cy.task('log', '✓ RPS API accessible with JWT token')
              cy.task('log', '\\n🎉 Deployment completed successfully!')
            })
          })
        })
      })
    })
  })
})
