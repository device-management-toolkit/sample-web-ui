/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a profile
import { empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { amtProfiles } from '../../fixtures/formEntry/profile'

// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach(() => {
    cy.setup()
    // Stub the requests
    cy.myIntercept('DELETE', /.*profiles.*/, {
      statusCode: httpCodes.NO_CONTENT
    }).as('delete-profile')
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles')
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')
  })

  it('should not delete when cancelled', () => {
    // Delete profile (but cancel)
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()
  })

  amtProfiles.forEach((profile: any) => {
    it(`should delete ${profile.profileName as string}`, () => {
      cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
        statusCode: httpCodes.SUCCESS,
        body: empty.response
      }).as('get-profiles4')
      // Delete profile
      cy.get('mat-row').contains(profile.profileName).parent().contains('delete').click()
      cy.get('button').contains('Yes').click()
      cy.wait('@delete-profile')
      cy.wait('@get-profiles4')
    })
  })
})
