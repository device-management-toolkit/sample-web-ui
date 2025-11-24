/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../fixtures/api/httpCodes'
import { wirelessFixtures } from '../fixtures/formEntry/wireless'
import { urlFixtures } from '../fixtures/formEntry/urls'
import { badRequest, empty } from '../fixtures/api/general'
import * as api8021x from '../fixtures/api/ieee8021x'

const baseUrl: string = Cypress.env('BASEURL')

describe('Test wireless creation page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
    api8021x.interceptGetAll(httpCodes.SUCCESS, api8021x.wirelessConfigsResponse).as('intercept8021xGetAll')
  })

  beforeEach('Set up the api stubs', () => {
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statuscode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-wireless3')

    cy.myIntercept('POST', 'wirelessconfigs', {
      statusCode: httpCodes.BAD_REQUEST,
      body: badRequest.response
    }).as('post-wireless')

    cy.goToPage('Wireless')
    cy.wait('@get-wireless3')

    cy.get('button').contains('Add New').click()
    cy.wait('@intercept8021xGetAll')
  })

  it('invalid profile name', () => {
    cy.enterWirelessInfo(
      wirelessFixtures.wrong.profileName,
      Cypress.env('WIFI_SSID'),
      Cypress.env('WIFI_PSK_PASSPHRASE'),
      wirelessFixtures.happyPath.authenticationMethod,
      wirelessFixtures.happyPath.encryptionMethod
    )
  })

  afterEach('Check for error', () => {
    cy.get('button[type=submit]').click()

    // Wait for requests to finish and check their responses
    cy.wait('@post-wireless').its('response.statusCode').should('eq', httpCodes.BAD_REQUEST)

    // Check that the wireless config creation failed
    cy.url().should('eq', baseUrl + urlFixtures.page.wireless + '/' + urlFixtures.extensions.creation)
  })
})
