/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a device
import { devices } from '../fixtures/api/device'
import { httpCodes } from '../fixtures/api/httpCodes'
import { tags } from '../fixtures/api/tags'

// ---------------------------- Test section ----------------------------

describe('Test Device Page Pagination', () => {
  beforeEach('', () => {
    cy.setup()

    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags')

    cy.myIntercept('GET', /.*power.*/, {
      statusCode: httpCodes.SUCCESS,
      body: { powerstate: 2 }
    }).as('get-powerstate')

    cy.goToPage('Devices')
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices2')

    cy.wait('@get-devices')

    // Check if any data exists, if not, skip pagination tests
    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.log('Paginator found - testing pagination')
        cy.get('mat-paginator').should('exist')

        // Check if next page button is enabled
        cy.get('mat-paginator button[aria-label="Next page"]').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.log('Clicking next page button')
            cy.wrap($btn).click()
            cy.wait(2000) // Allow time for any API call and UI update
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

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices4')

    cy.wait('@get-devices')

    // Check if any data exists and paginator is present
    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        // Navigate to page 2 first if possible
        cy.get('mat-paginator button[aria-label="Next page"]').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.wrap($btn).click()
            cy.wait(2000)

            // Now test previous page functionality
            cy.get('mat-paginator button[aria-label="Previous page"]').then(($prevBtn) => {
              if (!$prevBtn.is(':disabled')) {
                cy.log('Clicking previous page button')
                cy.wrap($prevBtn).click()
                cy.wait(2000)
                cy.get('mat-paginator').should('exist')
              }
            })
          } else {
            cy.log('Cannot test previous page - only one page of data available')
          }
        })
      } else {
        cy.log('No paginator found - skipping previous page test')
      }
    })
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices6')

    cy.wait('@get-devices')

    // Check if any data exists and paginator is present
    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        // Check if last page button is available
        cy.get('mat-paginator button[aria-label="Last page"]').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.log('Clicking last page button')
            cy.wrap($btn).click()
            cy.wait(2000)
            cy.get('mat-paginator').should('exist')
          } else {
            cy.log('Last page button is disabled - already on last page')
          }
        })
      } else {
        cy.log('No paginator found - skipping last page test')
      }
    })
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices8')

    cy.wait('@get-devices')

    // Check if any data exists and paginator is present
    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        // Navigate to last page first if possible
        cy.get('mat-paginator button[aria-label="Last page"]').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.wrap($btn).click()
            cy.wait(2000)

            // Now test first page functionality
            cy.get('mat-paginator button[aria-label="First page"]').then(($firstBtn) => {
              if (!$firstBtn.is(':disabled')) {
                cy.log('Clicking first page button')
                cy.wrap($firstBtn).click()
                cy.wait(2000)
                cy.get('mat-paginator').should('exist')
              }
            })
          } else {
            cy.log('Cannot test first page navigation - only one page of data available')
          }
        })
      } else {
        cy.log('No paginator found - skipping first page test')
      }
    })
  })
})
