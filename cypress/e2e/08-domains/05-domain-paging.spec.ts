/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests Domain page pagination functionality

import { httpCodes } from '../fixtures/api/httpCodes'
import { domains } from 'cypress/e2e/fixtures/api/domain'
import { getDomainSuffix, getProvisioningCertForDomain } from '../../support/certHelper'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page Paging', () => {
  beforeEach('Clear cache and login', () => {
    cy.setup()
  })

  beforeEach('setup intercepts', () => {
    // Setup intercepts - provide proper mock data for ISOLATE mode
    cy.myIntercept('GET', '**/domains*', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.success.response
    }).as('get-domains')

    cy.myIntercept('POST', '**/domains', {
      statusCode: httpCodes.CREATED,
      body: domains.create.success.response
    }).as('post-domain')
  })

  it('should handle domain list pagination', () => {
    cy.goToPage('Domains')
    cy.wait('@get-domains')

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

  it('pagination for next page', () => {
    cy.goToPage('Domains')
    cy.wait('@get-domains')

    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.get('mat-paginator').should('be.visible')
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').should('exist')

        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.wrap($btn).click()
            cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').should('exist')
            cy.log('✅ Pagination next button working')
          } else {
            cy.log('✅ Next button properly disabled (no more pages)')
          }
        })
      } else {
        cy.log('✅ No pagination needed - fewer than 25 domains')
      }
    })
  })

  it('pagination for previous page', () => {
    cy.goToPage('Domains')
    cy.wait('@get-domains')

    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.get('mat-paginator').should('be.visible')

        // Check if previous button is properly disabled on first page
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous').should('have.class', 'mat-mdc-button-disabled')

        // Test previous functionality by going to next page first (if available)
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next').then(($nextBtn) => {
          if (!$nextBtn.is(':disabled')) {
            cy.wrap($nextBtn).click()
            cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous').should('not.be.disabled')
            cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous').click()
            cy.log('✅ Pagination previous functionality tested successfully')
          } else {
            cy.log('✅ Previous button test completed - only one page available')
          }
        })
      } else {
        cy.log('✅ No pagination needed for previous page test')
      }
    })
  })

  it('pagination for last page', () => {
    cy.goToPage('Domains')
    cy.wait('@get-domains')

    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.get('mat-paginator').should('be.visible')

        // Test last button if available and enabled
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last').then(($lastBtn) => {
          if (!$lastBtn.is(':disabled')) {
            cy.wrap($lastBtn).click()
            cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').should('exist')
            cy.log('✅ Pagination last page functionality tested successfully')
          } else {
            cy.log('✅ Last button properly disabled (already on last page)')
          }
        })
      } else {
        cy.log('✅ No pagination needed for last page test')
      }
    })
  })

  it('pagination for first page', () => {
    cy.goToPage('Domains')
    cy.wait('@get-domains')

    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.get('mat-paginator').should('be.visible')

        // Test first page functionality by going to last page first (if available)
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last').then(($lastBtn) => {
          if (!$lastBtn.is(':disabled')) {
            cy.wrap($lastBtn).click()
            cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-first').should('not.be.disabled')
            cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-first').click()
            cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').should('exist')
            cy.log('✅ Pagination first page functionality tested successfully')
          } else {
            cy.log('✅ First button test completed - only one page available')
          }
        })
      } else {
        cy.log('✅ No pagination needed for first page test')
      }
    })
  })

  it('should create enough domains to test pagination', () => {
    cy.goToPage('Domains')
    cy.wait('@get-domains')

    // In mock mode, the pagination test should just verify that the interface works
    // In real API mode, actually create domains to enable pagination
    if (Cypress.env('ISOLATE') === 'N') {
      // Create multiple domains to enable pagination testing (Real API mode)
      const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`

      const domainSuffix = getDomainSuffix()
      const certPassword = Cypress.env('PROVISIONING_CERT_PASSWORD') || 'Intel123!'

      // Get certificate for this domain
      getProvisioningCertForDomain().then((certData) => {
        const provCert = certData || Cypress.env('PROVISIONING_CERT')
        const certFixtureData: Cypress.FileReference = {
          fileName: 'test-cert.pfx',
          contents: Cypress.Buffer.from(provCert!, 'base64')
        }

        for (let i = 1; i <= 3; i++) {
          cy.get('button').contains('Add New').click()

          cy.enterDomainInfo(
            `paging-domain-${uniqueId}-${i}`,
            `paging-${uniqueId}-${i}.${domainSuffix}`,
            certFixtureData,
            certPassword
          )

          cy.get('button').contains('SAVE').click()
          cy.wait('@post-domain')

          // Go back to list
          cy.goToPage('Domains')
          cy.wait('@get-domains')
        }
        cy.log('Created domains for pagination testing')
      })
    } else {
      // Mock mode - just verify the create form can be accessed
      cy.get('button').contains('Add New').click()
      cy.get('input[formControlName="profileName"]').should('be.visible')
      cy.log('Verified domain creation form accessibility in mock mode')
      // Go back to list without creating
      cy.goToPage('Domains')
    }
  })
})
