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

  it('deletes the default domain', () => {
    // Stub requests
    cy.myIntercept('DELETE', /.*domains.*/, {
      statusCode: httpCodes.NO_CONTENT,
      body: domains.delete.success.response
    }).as('delete-domain')

    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.success.response
    }).as('get-domains3')

    cy.goToPage('Domains')
    cy.wait('@get-domains3')

    // Delete Domain (but cancel)
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    // Check that the domain was not deleted
    cy.get('mat-cell').contains(domainFixtures.default.profileName)
    cy.get('mat-cell').contains(Cypress.env('DOMAIN_SUFFIX'))

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-domains4')

    // Delete Domain
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-domain')
    cy.wait('@get-domains4')

    // Check that the Domain was deleted properly
    cy.contains(domainFixtures.default.profileName).should('not.exist')
    cy.contains(Cypress.env('DOMAIN_SUFFIX')).should('not.exist')
  })
})
