/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a profile
import { httpCodes } from '../../fixtures/api/httpCodes'
import { devices } from '../../fixtures/api/device'
import { tags } from 'cypress/e2e/fixtures/api/tags'

// ---------------------------- Test section ----------------------------

describe('Test Device Page', () => {
  beforeEach('', () => {
    cy.setup()

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags')

    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.success.response
    }).as('get-devices')

    cy.myIntercept('GET', /.*power.*/, {
      statusCode: httpCodes.SUCCESS,
      body: { powerState: 2 }
    }).as('get-powerstate')
  })

  it('loads all the devices', () => {
    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    cy.wait('@get-powerstate').its('response.statusCode').should('eq', 200)
  })

  // UI Only
  it('filters for windows devices', () => {
    if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
      cy.myIntercept('GET', '**/devices?tags=Windows&$top=25&$skip=0&$count=true', {
        statusCode: httpCodes.SUCCESS,
        body: devices.getAll.windows.response.data
      }).as('get-windows')

      cy.goToPage('Devices')
      cy.wait('@get-tags')
      cy.wait('@get-devices')

      // Filter for Windows devices
      cy.get('[data-cy="filterTags"]').click()

      cy.contains('mat-option', 'Windows').click()

      cy.wait('@get-windows').its('response.statusCode').should('eq', 200)

      // Remove Filter for Windows devices
      cy.contains('mat-option', 'Windows').click()
      cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    }
  })

  it('selects the first device', () => {
    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    cy.wait('@get-tags').its('response.statusCode').should('eq', 200)

    cy.get('mat-table mat-row:first').click()
  })
})
