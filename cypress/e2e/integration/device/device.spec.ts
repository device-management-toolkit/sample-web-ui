/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a profile
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'

// ---------------------------- Test section ----------------------------

describe('Test Device Page', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('loads all the devices', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.success.response
    }).as('get-devices')

    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
  })

  // UI Only
  it('filters for windows devices', () => {
    if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
      cy.myIntercept('GET', /tags$/, {
        statusCode: httpCodes.SUCCESS,
        body: apiResponses.tags.getAll.success.response
      }).as('get-tags')

      cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
        statusCode: httpCodes.SUCCESS,
        body: apiResponses.devices.getAll.tags.response
      }).as('get-devices2')

      cy.myIntercept('GET', '**/devices?tags=Windows&$top=25&$skip=0&$count=true', {
        statusCode: httpCodes.SUCCESS,
        body: apiResponses.devices.getAll.windows.response
      }).as('get-windows')

      cy.goToPage('Devices')
      cy.wait('@get-tags')
      cy.wait('@get-devices2')

      // Filter for Windows devices
      cy.contains('Filter Tags').click({ force: true })
      cy.contains('.mat-option-text', 'Windows').click()

      // TODO: find a way to click off the tags table
      // TODO: find a good way to check if this test worked
    }
  })

  it('selects the first device', () => {
    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.tags.getAll.success.response
    }).as('get-tags')

    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.success.response
    }).as('get-devices')

    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    cy.wait('@get-tags').its('response.statusCode').should('eq', 200)

    cy.get('mat-table mat-row:first').click()
  })
})
