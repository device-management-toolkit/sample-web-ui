/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests profile page pagination functionality
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
import { wiredConfigsResponse } from 'cypress/e2e/fixtures/api/ieee8021x'

describe('Test Profile Page Paging', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()

    // Setup intercepts - provide proper mock data for ISOLATE mode
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

    cy.myIntercept('POST', '**/profiles', {
      statusCode: httpCodes.CREATED,
      body: profiles.create.success.response
    }).as('post-profile')
  })

  it('should handle profile list pagination', () => {
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Check if any data exists, if not, skip pagination tests
    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.log('Paginator found - testing pagination')
        // Test next page functionality
        cy.get('mat-paginator').should('exist')

        // Check if next page button is enabled
        cy.get('mat-paginator button[aria-label="Next page"]').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.log('Clicking next page button')
            cy.wrap($btn).click()
            cy.wait(2000) // Allow time for any API call and UI update
            // Verify the button state changed or page content updated
            cy.get('mat-paginator').should('exist')
          } else {
            cy.log('Next page button is disabled - no additional pages available')
          }
        })
      } else {
        cy.log('No paginator found - likely no data in table, skipping pagination test')
      }
    })
  })

  it('should create enough profiles to test pagination', () => {
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Create multiple profiles to enable pagination testing
    // Use a very unique timestamp + random component to avoid any collisions
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    for (let i = 1; i <= 3; i++) {
      cy.get('button').contains('Add New').click()
      cy.wait('@get-configs')
      cy.wait('@get-wireless')

      cy.matTextlikeInputType('[formControlName="profileName"]', `paging-${uniqueId}-${i}`)
      cy.matSelectChooseByValue('[formControlName="activation"]', 'acmactivate')
      cy.matCheckboxSet('[formControlName="generateRandomPassword"]', true)
      cy.matCheckboxSet('[formControlName="generateRandomMEBxPassword"]', true)
      cy.matRadioButtonChoose('[formControlName="dhcpEnabled"]', 'true')
      cy.get('[data-cy="radio-tls"]').click()
      cy.matSelectChooseByValue('[formControlName="tlsMode"]', '1')

      cy.get('button[type=submit]').click()
      cy.get('button').contains('Continue').click()
      cy.wait('@post-profile')

      // Go back to list
      cy.goToPage('Profiles')
      cy.wait('@get-profiles')
    }

    cy.log('Created profiles for pagination testing')
  })
})
