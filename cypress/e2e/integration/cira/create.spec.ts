/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a cira-config

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { ciraFixtures } from 'cypress/e2e/fixtures/formEntry/cira'
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { empty } from 'cypress/e2e/fixtures/api/general'

// ---------------------------- Test section ----------------------------

describe('Test CIRA Config Page', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('setup intercepts for UI Testing', () => {
    // Stub the get and post requests
    cy.myIntercept('GET', 'ciracert', {
      statusCode: httpCodes.SUCCESS,
      body: ciraFixtures.MpsCertificate
    }).as('certificate')

    cy.myIntercept('POST', 'ciraconfigs', {
      statusCode: httpCodes.CREATED,
      body: ciraConfig.create.success.response
    }).as('post-config')

    cy.myIntercept('GET', 'ciraconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-configs')
  })

  it('creates the default CIRA config', () => {
    // Fill out the config
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

    // change api response
    cy.myIntercept('GET', /.*ciraconfigs.*/, {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.success.response
    }).as('get-configs2')

    cy.get('button').contains('Add New').click()
    cy.enterCiraInfo(
      ciraFixtures.default.name,
      ciraFixtures.default.format,
      Cypress.env('FQDN'),
      Cypress.env('MPS_USERNAME')
    )
    cy.get('button[type=submit]').click({ timeout: 50000 })

    // Wait for requests to finish and check them their responses
    cy.wait('@post-config').then((req) => {
      cy.wrap(req).its('response.statusCode').should('eq', httpCodes.CREATED)
    })

    // TODO: check the response to make sure that it is correct
    // this is currently difficult because of the format of the response
    cy.wait('@get-configs2').its('response.statusCode').should('eq', httpCodes.SUCCESS)

    // //Check that the config was successful
    cy.get('mat-cell').contains(ciraFixtures.default.name)
    cy.get('mat-cell').contains(Cypress.env('FQDN'))
    cy.get('mat-cell').contains(Cypress.env('MPS_USERNAME'))
  })
})
