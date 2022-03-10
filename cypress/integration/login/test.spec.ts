/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the login page with a multitude of fake accounts in
// different combinations of invalid login info.
// Also tests things like canceling a login and logging out after the login

import { accountFixtures } from '../../fixtures/accounts'
import { urlFixtures } from '../../fixtures/urls'
import { httpCodes } from '../../fixtures/api/apiResponses'
// ---------------------------- Test section ----------------------------
const baseUrl: string = Cypress.env('BASEURL')

describe('Load Site', () => {
  it('loads the login page properly', () => {
    // Make sure the test always starts at the login page
    // and is never able to autologin
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })

    // Go to base site
    cy.visit(baseUrl)

    // Make sure the login page was hit
    cy.url().should('eq', baseUrl + urlFixtures.page.login)
  })
})

describe('Test login page', () => {
  it('logs in', () => {
    cy.myIntercept('POST', 'authorize', {
      statusCode: httpCodes.SUCCESS,
      body: { token: '' }
    }).as('login-request')

    // Login
    cy.login(accountFixtures.default.username, accountFixtures.default.password)
  })
})
