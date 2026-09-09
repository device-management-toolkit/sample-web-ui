/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { domainFixtures } from '../../fixtures/formEntry/domain'
import { secret } from '../../../support/secrets'

// Test REST call to Vault to verify Provisioning Certificate and Password are present

describe('REST API - Vault Test Suite', () => {
  it('REST API - Read Provisioning Certificate and Password from Vault test case', () => {
    if (Cypress.expose('ISOLATE') === 'N') {
      const vaultAddress: string = Cypress.expose('VAULT_ADDRESS')
      const vaultToken = secret('VAULT_TOKEN')
      const vaultURL = `${vaultAddress}/v1/secret/data/certs/${domainFixtures.default.profileName}`
      cy.request({
        auth: { bearer: vaultToken },
        method: 'GET',
        url: vaultURL
      }).should((response) => {
        expect(response.status).to.equal(httpCodes.SUCCESS)
        expect(JSON.stringify(response.body.data.data.CERT)).contains(secret('PROVISIONING_CERT'))
        expect(JSON.stringify(response.body.data.data.CERT_PASSWORD)).contains(secret('PROVISIONING_CERT_PASSWORD'))
      })
    }
  })
})
