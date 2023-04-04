/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Tests the creation of a profile
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { badRequest, empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
import { allConfigsResponse } from 'cypress/e2e/fixtures/api/ieee8021x'
import { profileFixtures } from 'cypress/e2e/fixtures/formEntry/profile'
import { urlFixtures } from 'cypress/e2e/fixtures/formEntry/urls'
import * as api8021x from '../../fixtures/api/ieee8021x'
const baseUrl: string = Cypress.env('BASEURL')

// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  beforeEach('', () => {
    cy.myIntercept('GET', 'ciraconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.forProfile.response
    }).as('get-configs2')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-profiles5')

    cy.myIntercept('GET', 'wirelessconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.success.response
    }).as('get-wireless2')

    api8021x
      .interceptGetAll(httpCodes.SUCCESS, allConfigsResponse)
      .as('intercept8021xGetAll')

    cy.myIntercept('POST', 'profiles', {
      statusCode: httpCodes.BAD_REQUEST,
      body: badRequest.response
    }).as('post-profile2')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles5')

    cy.get('button').contains('Add New').click()
    cy.wait('@get-configs2')
      .its('response.statusCode')
      .should('be.oneOf', [200, 304])
    cy.wait('@get-wireless2')
    cy.wait('@intercept8021xGetAll')
  })

  it('invalid profile name', () => {
    cy.enterProfileInfo(
      profileFixtures.wrong.name,
      profileFixtures.happyPath.activation,
      true,
      true,
      profileFixtures.happyPath.dhcpEnabled,
      profileFixtures.happyPath.connectionMode,
      profileFixtures.happyPath.ciraConfig,
      profileFixtures.happyPath.userConsent,
      profileFixtures.happyPath.iderEnabled,
      profileFixtures.happyPath.kvmEnabled,
      profileFixtures.happyPath.solEnabled
    )
  })

  afterEach('Check for error', () => {
    cy.get('button[type=submit]').click()
    cy.get('button').contains('Continue').click()

    // Wait for requests to finish and check their responses
    cy.wait('@post-profile2').then((req) => {
      cy.wrap(req)
        .its('response.statusCode')
        .should('eq', httpCodes.BAD_REQUEST)
    })

    // Check that the profile creation failed
    cy.url().should('eq', baseUrl + urlFixtures.page.profile + '/' + urlFixtures.extensions.creation)
  })
})
