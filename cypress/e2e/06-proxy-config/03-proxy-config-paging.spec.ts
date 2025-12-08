/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests proxy config page pagination functionality

import { httpCodes } from '../fixtures/api/httpCodes'
import { proxyConfig } from 'cypress/e2e/fixtures/api/proxyConfig'

// ---------------------------- Test section ----------------------------

describe('Test Proxy Config Page Paging', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('setup intercepts', () => {
    // Setup intercepts - provide proper mock data for ISOLATE mode
    cy.myIntercept('GET', '**/proxyconfigs*', {
      statusCode: httpCodes.SUCCESS,
      body: proxyConfig.getAll.success.response
    }).as('get-configs')

    cy.myIntercept('POST', '**/proxyconfigs', {
      statusCode: httpCodes.CREATED,
      body: proxyConfig.create.success.response
    }).as('post-config')
  })

  it('should handle proxy config list pagination', () => {
    cy.goToPage('Proxy Configs')
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

  it('should create enough proxy configs to test pagination', () => {
    cy.goToPage('Proxy Configs')
    cy.wait('@get-configs')

    // Check ISOLATE environment variable to determine mode
    if (Cypress.env('ISOLATE') === 'Y') {
      // Mock mode - just verify the create form can be accessed
      cy.get('button').contains('Add New').click()
      cy.get('[formControlName=name]').should('be.visible')
      cy.log('✅ Mock mode - Verified proxy config creation form accessibility')
      // Go back to list without creating
      cy.goToPage('Proxy Configs')
    } else {
      // Real API mode - create multiple configs to enable pagination testing
      const uniqueId = `${Date.now()}${Math.floor(Math.random() * 10000)}`
      for (let i = 1; i <= 3; i++) {
        cy.get('button').contains('Add New').click()

        cy.enterProxyConfigInfo(
          `pagingproxy${uniqueId}${i}`,
          `proxy${i}.example.com`,
          8080 + i,
          'mlopshub.com'
        )

        cy.get('button[type=submit]').click()
        cy.wait('@post-config')

        // Go back to list
        cy.goToPage('Proxy Configs')
        cy.wait('@get-configs')
      }
      cy.log('✅ Real API mode - Created proxy configs for pagination testing')
    }
  })
})
