/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// https://open-amt-cloud-toolkit.github.io/docs/1.1/General/createProfileACM/

import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { domainFixtures } from '../../fixtures/domain'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('before', () => {
    cy.setup()
  })

  it('creates the default domain with cert from fixture file upload', () => {
    // Stub the get and post requests
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.domains.getAll.empty.response
    }).as('get-domains')

    cy.myIntercept('POST', 'domains', {
      statusCode: httpCodes.CREATED,
      body: apiResponses.domains.create.success.response
    }).as('post-domain')

    cy.goToPage('Domains')
    cy.wait('@get-domains')

    // Fill out the profile
    cy.get('button').contains('Add New').click()

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.domains.getAll.success.response
    }).as('get-domains2')

    // handle file on disk or in-memory file
    const certFixtureData: Cypress.FileReference = {
      fileName: 'test-cert.pfx',
      contents: Cypress.Buffer.from(Cypress.env('PROVISIONING_CERT'))
    }

    cy.enterDomainInfo(
      domainFixtures.default.profileName,
      domainFixtures.default.domainSuffix,
      certFixtureData,
      Cypress.env('PROVISIONING_CERT_PASSWORD')
    )
    cy.get('button').contains('SAVE').click()
    cy.wait('@post-domain')
    cy.wait('@get-domains2')
      .its('response.statusCode')
      .should('eq', httpCodes.SUCCESS)
      // Check that the config was successful
    cy.get('mat-cell').contains(domainFixtures.default.profileName)
    cy.get('mat-cell').contains(domainFixtures.default.domainSuffix)
  })
})
