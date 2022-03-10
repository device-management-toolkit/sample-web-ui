/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a profile
import { profileFixtures } from '../../fixtures/profile'
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'

// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })
  it('should not delete when cancelled', () => {
    // Stub the requests
    cy.myIntercept('DELETE', /.*profiles.*/, {
      statusCode: httpCodes.NO_CONTENT
    }).as('delete-profile')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.profiles.getAll.success.response
    }).as('get-profiles3')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles3')

    // Delete profile (but cancel)
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    // Check that the profile was not deleted
    cy.get('mat-cell').contains(profileFixtures.happyPath.profileName)
    cy.get('mat-cell').contains(profileFixtures.check.network.dhcp.toString())
    cy.get('mat-cell').contains(profileFixtures.happyPath.ciraConfig)
    cy.get('mat-cell').contains(profileFixtures.check.mode.ccm)
  })
  it('deletes the default profile', () => {
    // Stub the requests
    cy.myIntercept('DELETE', /.*profiles.*/, {
      statusCode: httpCodes.NO_CONTENT
    }).as('delete-profile')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.profiles.getAll.success.response
    }).as('get-profiles3')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles3')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.profiles.getAll.empty.response
    }).as('get-profiles4')

    // Delete profile
    cy.get('mat-row').contains(profileFixtures.happyPath.profileName).parent().contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-profile')
    cy.wait('@get-profiles4')

    // Check that the config was deleted properly
    cy.contains(profileFixtures.happyPath.profileName).should('not.exist')
  })
})
