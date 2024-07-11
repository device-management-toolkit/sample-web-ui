/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the login page with a multitude of fake accounts in
// Checks to make sure that there are no domains, cira configs, or profiles present
// This ensures that the e2e flow is in the proper state before beginning

describe('Ensure the server is empty', () => {
  beforeEach('before', () => {
    cy.setup()
  })

  it('checks for domains', () => {
    if (Cypress.env('ISOLATE').charAt(0).toLowerCase() === 'n') {
      cy.goToPage('Domains')
      cy.contains('No Domains').should('be.visible')
    }
  })

  it('checks for cira configs', () => {
    if (Cypress.env('ISOLATE').charAt(0).toLowerCase() === 'n') {
      cy.goToPage('CIRA Configs')
      cy.contains('No CIRA Configs').should('be.visible')
    }
  })

  it('checks for profiles', () => {
    if (Cypress.env('ISOLATE').charAt(0).toLowerCase() === 'n') {
      cy.goToPage('Profiles')
      cy.contains('No Profiles').should('be.visible')
    }
  })
})
