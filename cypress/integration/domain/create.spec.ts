/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// https://open-amt-cloud-toolkit.github.io/docs/1.1/General/createProfileACM/

import 'cypress-file-upload'

import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { domainFixtures } from '../../fixtures/domain'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('before', () => {
    cy.setup()
  })

  it('creates the default domain', () => {
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

    // TODO: add file path and password once cypress-upload-file is added
    // and a spoof pfx file is created
    cy.enterDomainInfo(
      domainFixtures.default.name,
      domainFixtures.default.domain,
      domainFixtures.default.filePath,
      domainFixtures.default.password
    )

    cy.get('button').contains('SAVE').click()

    cy.wait('@post-domain')
    cy.wait('@get-domains2')
      .its('response.statusCode')
      .should('eq', httpCodes.SUCCESS)

    // Check that the config was successful
    cy.get('mat-cell').contains(domainFixtures.default.name)
    cy.get('mat-cell').contains(domainFixtures.default.domain)
  })
})
