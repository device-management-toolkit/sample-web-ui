/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a profile
import { profileFixtures } from '../../fixtures/profile'
import { apiResponses } from '../../fixtures/api/apiResponses'

// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('deletes the default profile', () => {
    // Stub the requests
    cy.myIntercept('DELETE', /.*profiles.*/, {
      statusCode: apiResponses.profiles.delete.success.code
    }).as('delete-profile')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.profiles.getAll.success.code,
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

    // Change api response
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.profiles.getAll.empty.code,
      body: apiResponses.profiles.getAll.empty.response
    }).as('get-profiles4')

    // Delete profile
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-profile')
    cy.wait('@get-profiles4')

    // Check that the config was deleted properly
    cy.contains(profileFixtures.happyPath.profileName).should('not.exist')
  })
})
