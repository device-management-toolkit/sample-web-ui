/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { domains } from 'cypress/e2e/fixtures/api/domain'
import { empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { domainFixtures } from 'cypress/e2e/fixtures/formEntry/domain'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('before', () => {
    cy.setup()
  })

  it('creates the default domain with cert from fixture file upload', () => {
    // Stub the get and post requests
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-domains')

    cy.myIntercept('POST', 'domains', {
      statusCode: httpCodes.CREATED,
      body: domains.create.success.response
    }).as('post-domain')

    cy.goToPage('Domains')
    cy.wait('@get-domains')

    // Fill out the profile
    cy.get('button').contains('Add New').click({ force: true })
    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.success.response
    }).as('get-domains2')

    // handle file on disk or in-memory file
    const certFixtureData: Cypress.FileReference = {
      fileName: 'test-cert.pfx',
      contents: Cypress.Buffer.from(Cypress.env('PROVISIONING_CERT'), 'base64')
    }

    cy.enterDomainInfo(
      domainFixtures.default.profileName,
      Cypress.env('DOMAIN_SUFFIX'),
      certFixtureData,
      Cypress.env('PROVISIONING_CERT_PASSWORD')
    )
    cy.get('button').contains('SAVE').click({ force: true })
    cy.wait('@post-domain').its('response.statusCode').should('eq', httpCodes.CREATED)
    cy.wait('@get-domains2').its('response.statusCode').should('eq', httpCodes.SUCCESS)
    // Check that the config was successful
    cy.get('mat-cell').contains(domainFixtures.default.profileName)
    cy.get('mat-cell').contains(Cypress.env('DOMAIN_SUFFIX'))
  })
})
