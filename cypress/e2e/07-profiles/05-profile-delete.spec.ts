/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
import { wiredConfigsResponse } from 'cypress/e2e/fixtures/api/ieee8021x'

describe('Test Profile Delete', () => {
  beforeEach(() => {
    cy.setup()

    // Setup intercepts with proper mock data for ISOLATE mode
    cy.myIntercept('GET', '**/profiles*', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles')

    cy.myIntercept('GET', '**/ciraconfigs*', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.success.response
    }).as('get-configs')

    cy.myIntercept('GET', '**/wirelessconfigs*', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.success.response
    }).as('get-wireless')

    cy.myIntercept('GET', '**/ieee8021xconfigs*', {
      statusCode: httpCodes.SUCCESS,
      body: wiredConfigsResponse
    }).as('get-8021x')

    cy.myIntercept('DELETE', '**/profiles/**', {
      statusCode: httpCodes.NO_CONTENT
    }).as('delete-profile')

    cy.myIntercept('POST', '**/profiles', {
      statusCode: httpCodes.CREATED,
      body: profiles.create.success.response
    }).as('post-profile')
  })

  it('should delete a profile successfully', () => {
    // Navigate to profiles
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Create a profile to delete if none exist
    cy.get('body').then(($body) => {
      if ($body.text().includes('No Profiles')) {
        cy.get('button').contains('Add New').click()
        cy.wait('@get-configs')

        cy.matTextlikeInputType('[formControlName="profileName"]', 'profile-to-delete')
        cy.matSelectChooseByValue('[formControlName="activation"]', 'acmactivate')
        cy.matCheckboxSet('[formControlName="generateRandomPassword"]', true)
        cy.matCheckboxSet('[formControlName="generateRandomMEBxPassword"]', true)
        cy.matRadioButtonChoose('[formControlName="dhcpEnabled"]', 'true')
        cy.get('[data-cy="radio-tls"]').click()
        cy.matSelectChooseByValue('[formControlName="tlsMode"]', '1')

        cy.get('button[type=submit]').click()
        cy.get('button').contains('Continue').click()
        cy.wait('@post-profile')

        cy.goToPage('Profiles')
        cy.wait('@get-profiles')
      }
    })

    // Delete the first profile
    cy.get('mat-cell').contains('delete').first().click()
    cy.get('button').contains('Yes').click()

    // Wait for delete API call and verify
    cy.wait('@delete-profile', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 204])
      cy.log('Profile deleted successfully!')
    })
  })

  it('should cancel delete when user clicks No', () => {
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Ensure at least one profile exists
    cy.get('body').then(($body) => {
      if (!$body.text().includes('No Profiles')) {
        // Try to delete but cancel
        cy.get('mat-cell').contains('delete').first().click()
        cy.get('button').contains('No').click()

        // Profile should still exist - no API call should be made
        cy.get('@delete-profile.all').should('have.length', 0)
      }
    })
  })
})
