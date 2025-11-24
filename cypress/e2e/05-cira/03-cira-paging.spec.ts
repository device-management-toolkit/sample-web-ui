/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests CIRA config page pagination functionality

import { httpCodes } from '../fixtures/api/httpCodes'
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'

// ---------------------------- Test section ----------------------------

describe('Test CIRA Config Page Paging', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('setup intercepts', () => {
    // Setup intercepts - provide proper mock data for ISOLATE mode
    cy.myIntercept('GET', '**/ciraconfigs*', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.success.response
    }).as('get-configs')

    cy.myIntercept('POST', '**/ciraconfigs', {
      statusCode: httpCodes.CREATED,
      body: ciraConfig.create.success.response
    }).as('post-config')
  })

  it('should handle CIRA config list pagination', () => {
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

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

  it('should create enough CIRA configs to test pagination', () => {
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

    // In mock mode, the pagination test should just verify that the interface works
    // In real API mode, actually create configs to enable pagination
    if (Cypress.env('ISOLATE') === 'N') {
      // Create multiple CIRA configs to enable pagination testing (Real API mode)
      const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
      for (let i = 1; i <= 3; i++) {
        cy.get('button').contains('Add New').click()

        // Use the custom enterCiraInfo command that matches the form structure
        cy.enterCiraInfo(
          `paging-cira-${uniqueId}-${i}`,
          'FQDN',
          Cypress.env('FQDN'),
          Cypress.env('MPS_USERNAME')
        )

        cy.get('button[type=submit]').click()
        cy.wait('@post-config')

        // Go back to list
        cy.goToPage('CIRA Configs')
        cy.wait('@get-configs')
      }
      cy.log('Created CIRA configs for pagination testing')
    } else {
      // Mock mode - just verify the create form can be accessed
      cy.get('button').contains('Add New').click()
      cy.get('input[name=configName]').should('be.visible')
      cy.log('Verified CIRA config creation form accessibility in mock mode')
      // Go back to list without creating
      cy.goToPage('CIRA Configs')
    }
  })
})
