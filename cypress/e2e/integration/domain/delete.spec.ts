/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// https://open-amt-cloud-toolkit.github.io/docs/1.1/General/createProfileACM/

import { domainFixtures } from '../../fixtures/domain'
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('before', () => {
    cy.setup()
  })

  it('deletes the default domain', () => {
    // Stub requests
    cy.myIntercept('DELETE', /.*domains.*/, {
      statusCode: httpCodes.NO_CONTENT,
      body: apiResponses.domains.delete.success.response
    }).as('delete-domain')

    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.domains.getAll.success.response
    }).as('get-domains3')

    cy.goToPage('Domains')
    cy.wait('@get-domains3')

    // Delete Domain (but cancel)
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    // Check that the domain was not deleted
    cy.get('mat-cell').contains(domainFixtures.default.profileName)
    cy.get('mat-cell').contains(domainFixtures.default.domainSuffix)

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.domains.getAll.empty.response
    }).as('get-domains4')

    // Delete Domain
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-domain')
    cy.wait('@get-domains4')

    // Check that the Domain was deleted properly
    cy.contains(domainFixtures.default.profileName).should('not.exist')
    cy.contains(domainFixtures.default.domainSuffix).should('not.exist')
  })
})
