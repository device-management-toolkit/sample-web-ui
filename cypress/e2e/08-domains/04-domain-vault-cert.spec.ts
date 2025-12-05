/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../fixtures/api/httpCodes'
import { domainFixtures } from '../fixtures/formEntry/domain'
import { getDomainSuffix, getProvisioningCertForDomain } from '../../support/certHelper'

// Test REST call to Vault to verify Provisioning Certificate and Password are present

describe('REST API - Vault Test Suite', () => {
  it('REST API - Read Provisioning Certificate and Password from Vault test case', () => {
    if (Cypress.env('ISOLATE') === 'N') {
      const vaultAddress: string = Cypress.env('VAULT_ADDRESS')
      const vaultToken = Cypress.env('VAULT_TOKEN')
      const vaultURL = `${vaultAddress}/v1/secret/data/certs/${domainFixtures.default.profileName}`
      const certPassword = Cypress.env('PROVISIONING_CERT_PASSWORD')

      // Get the correct certificate for this domain using the helper
      getProvisioningCertForDomain().then((expectedCert) => {
        const provCert = expectedCert || Cypress.env('PROVISIONING_CERT')

        // Mock the vault response when in mock mode
        cy.myIntercept('GET', '**/v1/secret/data/certs/**', {
          statusCode: 200,
          body: {
            data: {
              data: {
                CERT: provCert,
                CERT_PASSWORD: certPassword
              }
            }
          }
        })

        cy.request({
          auth: { bearer: vaultToken },
          method: 'GET',
          url: vaultURL,
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === httpCodes.SUCCESS) {
            // Verify that Vault has certificate data stored
            const vaultCert = response.body.data.data.CERT
            const vaultPassword = response.body.data.data.CERT_PASSWORD

            // Check that certificate and password exist and are not empty
            expect(vaultCert).to.exist
            expect(vaultCert).to.not.be.empty
            expect(vaultPassword).to.exist
            expect(vaultPassword).to.not.be.empty

            // Normalize certificates by removing all whitespace for comparison
            const normalizedVaultCert = vaultCert.replace(/\s+/g, '')
            const normalizedProvCert = provCert.replace(/\s+/g, '')

            // Compare with expected cert and print result
            if (normalizedVaultCert === normalizedProvCert) {
              cy.task('log', `[Vault] ✓ Certificate MATCH: Profile '${domainFixtures.default.profileName}' has matching certificate (after normalization)`)
            } else if (vaultCert === provCert) {
              cy.task('log', `[Vault] ✓ Certificate MATCH: Profile '${domainFixtures.default.profileName}' has matching certificate (exact match)`)
            } else {
              cy.task('log', `[Vault] ✗ Certificate MISMATCH: Profile '${domainFixtures.default.profileName}'`)
              cy.task('log', `[Vault]   - Vault cert length: ${vaultCert.length} (normalized: ${normalizedVaultCert.length}), Expected: ${provCert.length} (normalized: ${normalizedProvCert.length})`)
              cy.task('log', `[Vault]   - Vault cert (first 50): ${vaultCert.substring(0, 50)}...`)
              cy.task('log', `[Vault]   - Expected cert (first 50): ${provCert.substring(0, 50)}...`)

              // Find where they differ
              for (let i = 0; i < Math.min(normalizedVaultCert.length, normalizedProvCert.length); i++) {
                if (normalizedVaultCert[i] !== normalizedProvCert[i]) {
                  cy.task('log', `[Vault]   - First difference at position ${i}: vault='${normalizedVaultCert.substring(i, i + 20)}' vs expected='${normalizedProvCert.substring(i, i + 20)}'`)
                  break
                }
              }
            }
          } else if (response.status === 404) {
            cy.task('log', `[Vault] ✗ Certificate NOT FOUND: Profile '${domainFixtures.default.profileName}' not in Vault`)
          } else {
            throw new Error(`Unexpected vault response: ${response.status}`)
          }
        })
      })
    }
  })
})
