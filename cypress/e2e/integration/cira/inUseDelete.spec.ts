/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a cira-config

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { ciraFixtures } from 'cypress/e2e/fixtures/formEntry/cira'
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { empty } from 'cypress/e2e/fixtures/api/general'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { profileFixtures } from 'cypress/e2e/fixtures/formEntry/profile'

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

  it('creates the default CIRA config, create a profile using the config and attempts to delete the config', () => {
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

    cy.wait('@get-configs2').its('response.statusCode').should('eq', httpCodes.SUCCESS)

    // //Check that the config was successful
    cy.get('mat-cell').contains(ciraFixtures.default.name)
    cy.get('mat-cell').contains(Cypress.env('FQDN'))
    cy.get('mat-cell').contains(Cypress.env('MPS_USERNAME'))

    cy.myIntercept('POST', 'profiles', {
      statusCode: httpCodes.CREATED,
      body: profiles.create.success.response
    }).as('post-profile')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-profiles')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // change api response
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles2')

    // Fill out the profile
    cy.get('button').contains('Add New').click()
    cy.enterProfileInfo(
      profileFixtures.happyPath.profileName,
      profileFixtures.happyPath.activation,
      false,
      false,
      profileFixtures.happyPath.dhcpEnabled,
      profileFixtures.happyPath.connectionMode,
      profileFixtures.happyPath.ciraConfig,
      profileFixtures.happyPath.userConsent,
      profileFixtures.happyPath.iderEnabled,
      profileFixtures.happyPath.kvmEnabled,
      profileFixtures.happyPath.solEnabled
    )
    cy.get('button').contains('SAVE').click()
    cy.wait('@get-profiles2')

    cy.myIntercept('GET', 'ciraconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.success.response
    }).as('get-configs3')

    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs3')

    cy.myIntercept('DELETE', /.*ciraconfigs.*/, {
      statusCode: httpCodes.BAD_REQUEST,
      body: ciraConfig.inUse.error.response
    }).as('delete-ciraconfig')

    cy.get('[data-cy="delete"]').first().click()
    cy.get('[data-cy="yes"]').click()
    cy.wait('@delete-ciraconfig')

    // Check for snackbar text
    cy.get('simple-snack-bar').contains('associated with an AMT profile').should('exist')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles3')

    // Delete the profile
    cy.goToPage('Profiles')
    cy.wait('@get-profiles3')

    cy.get('[data-cy="delete"]').first().click()
    cy.get('[data-cy="yes"]').click()

    cy.myIntercept('GET', 'ciraconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.success.response
    }).as('get-configs4')

    // Delete the CIRA config
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs4')

    cy.get('[data-cy="delete"]').first().click()
    cy.get('[data-cy="yes"]').click()
  })
})
