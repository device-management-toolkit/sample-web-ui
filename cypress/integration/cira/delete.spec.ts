/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a cira-config

import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { ciraFixtures } from '../../fixtures/cira'

// ---------------------------- Test section ----------------------------

describe('Test CIRA Config Page', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  it('deletes the default cira config', () => {
    cy.myIntercept('DELETE', /.*ciraconfigs.*/, {
      statusCode: httpCodes.NO_CONTENT
    }).as('delete-config')

    cy.myIntercept('GET', 'ciraconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.ciraConfigs.getAll.success.response
    }).as('get-configs')

    // Delete CIRA Config (but cancel)
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    // Check that the config was not deleted
    cy.get('mat-cell').contains(ciraFixtures.default.name)
    cy.get('mat-cell').contains(Cypress.env('FQDN'))
    cy.get('mat-cell').contains(Cypress.env('MPSUSERNAME'))

    // Change api response
    cy.myIntercept('GET', 'ciraconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.ciraConfigs.getAll.empty.response
    }).as('get-configs')

    // Delete CIRA Config
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-config')

    // Check that the config was deleted properly
    cy.contains(ciraFixtures.default.name).should('not.exist')
  })
})
