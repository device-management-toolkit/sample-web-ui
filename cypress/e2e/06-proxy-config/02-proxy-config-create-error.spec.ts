/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests error handling in proxy-config creation

import { badRequest, empty } from '../fixtures/api/general'
import { httpCodes } from '../fixtures/api/httpCodes'
import { proxyConfigFixtures } from '../fixtures/formEntry/proxyConfig'
import { urlFixtures } from '../fixtures/formEntry/urls'
const baseUrl: string = Cypress.env('BASEURL')

// ---------------------------- Test section ----------------------------

describe('Test Proxy Config Page', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('fills out the config', () => {
    cy.myIntercept('POST', 'proxyconfigs', {
      statusCode: httpCodes.BAD_REQUEST,
      body: badRequest.response
    }).as('post-config1')

    cy.myIntercept('GET', 'proxyconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-configs')

    cy.goToPage('Proxy Configs')
    cy.wait('@get-configs')

    cy.get('button').contains('Add New').click()
  })

  it('invalid config name triggers error response', () => {
    cy.enterProxyConfigInfo(
      proxyConfigFixtures.wrong.name,
      proxyConfigFixtures.default.address,
      proxyConfigFixtures.default.port,
      proxyConfigFixtures.default.networkDnsSuffix
    )

    // Check if form validation is working (mock mode with Angular validation)
    cy.get('button[type=submit]').then(($btn) => {
      if ($btn.is(':disabled')) {
        // Form validation prevents submission - verify error message
        cy.get('mat-error').should('contain', 'alphanumeric')
        cy.log('✅ Form validation working - submit button disabled')
      } else {
        // No form validation - test API error response (real API mode)
        cy.get('button[type=submit]').click()
        cy.wait('@post-config1').its('response.statusCode').should('eq', 400)
        cy.log('✅ API error handling working - received 400 response')
      }
    })

    const url = baseUrl + 'proxy-configs/new'
    cy.url().should('eq', url)
  })
})
