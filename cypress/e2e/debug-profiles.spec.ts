/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

describe('Debug Profiles Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('Check profiles page loading and elements', () => {
    cy.goToPage('Profiles')

    // Wait a bit for page to load
    cy.wait(2000)

    // Check if page loaded
    cy.get('body').should('be.visible')

    // Check for any error messages
    cy.get('body').then(($body) => {
      cy.log('Page body content length: ' + $body.text().length)
    })

    // Look for table or data elements
    cy.get('body').should('contain.text', 'Profile')

    // Check if mat-paginator exists
    cy.get('body').then(($body) => {
      if ($body.find('mat-paginator').length > 0) {
        cy.log('✅ mat-paginator found')
        cy.get('mat-paginator').should('be.visible')
        cy.get('mat-paginator .mat-mdc-paginator-range-label').then(($el) => {
          cy.log('Paginator text: ' + $el.text())
        })
      } else {
        cy.log('❌ mat-paginator NOT found')
        // Check what's on the page instead
        cy.get('mat-table, table, .no-data, .error', { timeout: 1000 }).then(($els) => {
          $els.each((i, el) => {
            cy.log('Found element: ' + el.tagName + ' - ' + el.textContent.substring(0, 100))
          })
        })
      }
    })

    // Check for any profile data
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      if (bodyText.includes('No data')) {
        cy.log('❌ No profiles data found')
      } else if (bodyText.includes('profile')) {
        cy.log('✅ Some profile data found')
      }
    })
  })
})