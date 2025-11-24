/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a cira-config

import { httpCodes } from '../fixtures/api/httpCodes'
import { ciraFixtures } from '../fixtures/formEntry/cira'
import { ciraConfig } from '../fixtures/api/cira'
import { empty } from '../fixtures/api/general'
import { profiles } from '../fixtures/api/profile'
import { profileFixtures } from '../fixtures/formEntry/profile'

// ---------------------------- Test section ----------------------------

describe('Test CIRA Config Page', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('setup intercepts for UI Testing', () => {
    // Setup mocked responses for CIRA configs
    cy.myIntercept('GET', '**/ciracert', {
      statusCode: httpCodes.SUCCESS,
      body: { cert: 'mock-certificate' }
    }).as('certificate')

    cy.myIntercept('POST', '**/ciraconfigs', {
      statusCode: httpCodes.CREATED,
      body: ciraConfig.create.success.response
    }).as('post-config')

    cy.myIntercept('GET', '**/ciraconfigs*', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.success.response
    }).as('get-configs')

    cy.myIntercept('DELETE', '**/ciraconfigs/*', {
      statusCode: httpCodes.BAD_REQUEST,
      body: ciraConfig.inUse.error.response
    }).as('delete-ciraconfig-inuse')

    // Setup mocked responses for profiles
    cy.myIntercept('GET', '**/profiles*', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles')

    cy.myIntercept('POST', '**/profiles', {
      statusCode: httpCodes.CREATED,
      body: profiles.create.success.response
    }).as('post-profile')

    cy.myIntercept('DELETE', '**/profiles/*', {
      statusCode: httpCodes.SUCCESS,
      body: empty
    }).as('delete-profile')
  })

  it('attempts to delete CIRA config that is in use by profile', () => {
    // Navigate to CIRA Configs page
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

    // Create a CIRA config first
    cy.get('button').contains('Add New').click()
    cy.enterCiraInfo(
      ciraFixtures.default.name,
      ciraFixtures.default.format,
      Cypress.env('FQDN'),
      Cypress.env('MPS_USERNAME')
    )
    cy.get('button[type=submit]').click()
    cy.wait('@post-config')

    // Wait for navigation back to configs list
    cy.wait(2000)
    cy.url().should('include', '/ciraconfigs')

    // Create a profile that uses the CIRA config
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

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
    cy.wait('@post-profile')
    cy.wait(2000)

    // Go back to CIRA Configs and attempt to delete the config
    cy.goToPage('CIRA Configs')
    cy.wait(2000)

    // Try to delete the CIRA config (should fail because it's in use)
    cy.get('[data-cy="delete"]').first().click()
    cy.get('[data-cy="yes"]').click()

    // For mocked mode, verify the error response is handled
    if (Cypress.env('ISOLATE') === 'Y') {
      cy.wait('@delete-ciraconfig-inuse')

      // Check for error message about config being in use
      cy.get('body').should('contain.text', 'associated')
      cy.log('✅ CIRA config deletion properly failed - config is in use by profile (mocked)')
    } else {
      // For real API mode, just wait and check for any response
      cy.wait(3000)
      cy.log('✅ CIRA config deletion attempted with real API')
    }
  })
})
