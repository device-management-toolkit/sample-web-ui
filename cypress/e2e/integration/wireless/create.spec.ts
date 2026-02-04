/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
import { wirelessFixtures } from 'cypress/e2e/fixtures/formEntry/wireless'
import * as api8021x from 'cypress/e2e/fixtures/api/ieee8021x'

describe('create a wireless profile', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('creates a default profile', () => {
    // Only intercept ieee8021xconfigs for console mode (CLOUD=false)
    // In cloud mode, this feature is not available
/*    if (!Cypress.env('CLOUD')) {
      cy.myIntercept('GET', 'ieee8021xconfigs?$count=true', {
        statusCode: httpCodes.SUCCESS,
        body: api8021x.noConfigsResponse
      }).as('ieee8021xConfigsGetAll')
    }*/

    cy.myIntercept('GET', 'wirelessconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.success.response
    }).as('wirelessconfigsGetAll')

    cy.myIntercept('POST', 'wirelessconfigs', {
      statusCode: httpCodes.CREATED,
      body: wirelessConfigs.create.success.response
    }).as('post-wireless')

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-wireless')

    cy.goToPage('Wireless')
    cy.wait('@get-wireless')

    // change api response
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.success.response
    }).as('get-wireless2')

    cy.get('button').contains('Add New').click()
    cy.enterWirelessInfo(
      wirelessFixtures.happyPath.profileName,
      Cypress.env('WIFI_SSID'),
      Cypress.env('WIFI_PSK_PASSPHRASE'),
      wirelessFixtures.happyPath.authenticationMethod,
      wirelessFixtures.happyPath.encryptionMethod
    )
    cy.get('button[type=submit]').click()

    cy.wait('@post-wireless').then((req) => {
      cy.wrap(req).its('response.statusCode').should('eq', httpCodes.CREATED)

      // Check that the wireless config was successful
      cy.get('mat-cell').contains(wirelessFixtures.happyPath.profileName).should('be.visible')
      
      // Add a small delay to ensure video captures the final state
      cy.wait(5000)
    })
  })
})
