/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a cira-config

import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { ciraFixtures } from '../../fixtures/cira'
import { urlFixtures } from '../../fixtures/urls'
const baseUrl: string = Cypress.env('BASEURL')

// ---------------------------- Test section ----------------------------

describe('Test CIRA Config Page', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('fills out the config', () => {
    cy.myIntercept('GET', 'ciracert', {
      statusCode: httpCodes.SUCCESS,
      body: ciraFixtures.MpsCertificate
    }).as('certificate1')

    cy.intercept('POST', 'ciraconfigs', {
      statusCode: httpCodes.BAD_REQUEST,
      body: apiResponses.ciraConfigs.create.badRequest.response
    }).as('post-config1')

    cy.intercept('GET', 'ciraconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.ciraConfigs.getAll.empty.response
    }).as('get-configs')

    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

    cy.get('button').contains('Add New').click()
  })

  it('invalid config name', () => {
    cy.enterCiraInfo(
      ciraFixtures.wrong.name,
      ciraFixtures.default.format,
      ciraFixtures.default.addr,
      Cypress.env('MPSUSERNAME')
    )
  })

  it('invalid username', () => {
    cy.enterCiraInfo(
      ciraFixtures.wrong.name,
      ciraFixtures.default.format,
      ciraFixtures.default.addr,
      ciraFixtures.wrong.username
    )
  })

  afterEach('Check that the error occured', () => {
    cy.get('button[type=submit]').click()

    cy.wait('@certificate1')
    cy.wait('@post-config1').its('response.statusCode').should('eq', 400)

    const url = baseUrl + urlFixtures.page.cira + '/' + urlFixtures.extensions.creation
    cy.url().should('eq', url)
  })
})
