/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { domainFixtures } from '../../fixtures/formEntry/domain'

// Test REST call to Vault to verify Provisioning Certificate and Password are present

describe('REST API - Vault Test Suite', () => {
  it('REST API - Read Provisioning Certificate and Password from Vault test case', () => {
    if (Cypress.expose('ISOLATE') !== 'N') return
    return cy
      .env([
        'VAULT_TOKEN',
        'PROVISIONING_CERT',
        'PROVISIONING_CERT_PASSWORD'
      ])
      .then(({ VAULT_TOKEN, PROVISIONING_CERT, PROVISIONING_CERT_PASSWORD }) => {
        const vaultAddress: string = Cypress.expose('VAULT_ADDRESS')
        const vaultToken = VAULT_TOKEN
        const vaultURL = `${vaultAddress}/v1/secret/data/certs/${domainFixtures.default.profileName}`
        cy.request({
          auth: { bearer: vaultToken },
          method: 'GET',
          url: vaultURL,
          log: false
        }).should((response) => {
          expect(response.status).to.equal(httpCodes.SUCCESS)
          expect(
            JSON.stringify(response.body.data.data.CERT).includes(PROVISIONING_CERT),
            'Vault certificate matches'
          ).to.eq(true)
          expect(
            JSON.stringify(response.body.data.data.CERT_PASSWORD).includes(PROVISIONING_CERT_PASSWORD),
            'Vault certificate password matches'
          ).to.eq(true)
        })
      })
  })
})
