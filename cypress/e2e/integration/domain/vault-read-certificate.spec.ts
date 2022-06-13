/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Test REST call to Vault to verify Provisioning Certificate and Password are present
import { httpCodes } from '../../fixtures/api/apiResponses'
import { domainFixtures } from '../../fixtures/domain'

describe('REST API - Vault Test Suite', () => {
  it('REST API - Read Provisioning Certificate and Password from Vault test case', () => {
    if (Cypress.env('ISOLATE') === 'N') {
      const vaultAddress: string = Cypress.env('VAULT_ADDRESS')
      const vaultToken = Cypress.env('VAULT_TOKEN')
      const vaultURL = `${vaultAddress}/v1/secret/data/certs/${domainFixtures.default.profileName}`
      cy.request({
        auth: { bearer: vaultToken },
        method: 'GET',
        url: vaultURL
      }).should(response => {
        expect(response.status).to.equal(httpCodes.SUCCESS)
        expect(JSON.stringify(response.body.data.data.CERT)).contains(Cypress.env('PROVISIONING_CERT'))
        expect(JSON.stringify(response.body.data.data.CERT_PASSWORD)).contains(Cypress.env('PROVISIONING_CERT_PASSWORD'))
      })
    }
  })
})
