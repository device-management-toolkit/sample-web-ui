/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { wirelessFixtures } from '../../fixtures/wireless'

describe('create a wireless profile', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('creates a deafault profile', () => {
    cy.myIntercept('POST', 'wirelessconfigs', {
      statusCode: httpCodes.CREATED,
      body: apiResponses.wirelessConfigs.create.success.response
    }).as('post-wireless')

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.wirelessConfigs.getAll.empty.response
    }).as('get-wireless')

    cy.goToPage('Wireless')
    cy.wait('@get-wireless')

    // change api response
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.wirelessConfigs.getAll.success.response
    }).as('get-wireless2')

    cy.get('button').contains('Add New').click()
    cy.enterWirelessInfo(
      wirelessFixtures.happyPath.profileName,
      wirelessFixtures.happyPath.ssid,
      Cypress.env('PSKPASSPHRASE')
    )
    cy.get('button[type=submit]').click()

    cy.wait('@post-wireless').then((req) => {
      cy.wrap(req)
        .its('response.statusCode')
        .should('eq', httpCodes.CREATED)

      // Check that the wireless config was successful
      cy.get('mat-cell').contains(wirelessFixtures.happyPath.profileName)
    })
  })
})
