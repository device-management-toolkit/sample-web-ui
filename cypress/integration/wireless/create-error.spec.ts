/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { urlFixtures } from '../../fixtures/urls'
import { apiResponses } from '../../fixtures/api/apiResponses'
import { wirelessFixtures } from '../../fixtures/wireless'
const baseUrl: string = Cypress.env('BASEURL')

describe('Test wireless creation page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  beforeEach('Set up the api stubs', () => {
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statuscode: apiResponses.wirelessConfigs.getAll.empty.code,
      body: apiResponses.wirelessConfigs.getAll.empty.response
    }).as('get-wireless3')

    cy.myIntercept('POST', 'wirelessconfigs', {
      statusCode: apiResponses.wirelessConfigs.create.badRequest.code,
      body: apiResponses.wirelessConfigs.create.badRequest.response
    }).as('post-wireless')

    cy.goToPage('Wireless')
    cy.wait('@get-wireless3')

    cy.get('button').contains('Add New').click()
  })

  it('invalid profile name', () => {
    cy.enterWirelessInfo(
      wirelessFixtures.wrong.profileName,
      wirelessFixtures.happyPath.ssid,
      Cypress.env('PSKPASSPHRASE')
    )
  })

  afterEach('Check for error', () => {
    cy.get('button[type=submit]').click()

    // Wait for requests to finish and check their responses
    cy.wait('@post-wireless').then((req) => {
      cy.wrap(req)
        .its('response.statusCode')
        .should('eq', apiResponses.wirelessConfigs.create.badRequest.code)
    })

    // Check that the wireless config creation failed
    cy.url().should('eq', baseUrl + urlFixtures.page.wireless + '/' + urlFixtures.extensions.creation)
  })
})
