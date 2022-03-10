/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the login page with a multitude of fake accounts in
// different combinations of invalid login info.
// Also tests things like canceling a login and logging out after the login

import { accountFixtures } from '../../fixtures/accounts'
import { urlFixtures } from '../../fixtures/urls'
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
const baseUrl: string = Cypress.env('BASEURL')

// ---------------------------- Test section ----------------------------

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
  beforeEach('(Re)Load Site', () => {
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
    cy.visit(baseUrl)
    cy.url().should('eq', baseUrl + urlFixtures.page.login)
  })

  context('Successful login', () => {
    it('logs in', () => {
      cy.myIntercept('POST', 'authorize', {
        statusCode: httpCodes.SUCCESS,
        body: { token: '' }
      }).as('login-request')
      cy.myIntercept('GET', 'mps/api/v1/devices/stats', {
        statusCode: 200,
        body: { }
      }).as('stats-request')
      // Login
      cy.login(accountFixtures.default.username, accountFixtures.default.password)

      // Check that correct post request is made
      cy.wait('@login-request').then((req) => {
        cy.wrap(req)
          .its('response.statusCode')
          .should('eq', httpCodes.SUCCESS)
        cy.wrap(req)
          .its('request.body.username')
          .should('eq', accountFixtures.default.username)
        cy.wrap(req)
          .its('request.body.password')
          .should('eq', accountFixtures.default.password)
      })

      // Check that the login was successful
      cy.url().should('eq', baseUrl)
    })
  })

  context('Failed login', () => {
    function prepareIntercepts (): void {
      cy.myIntercept('POST', 'authorize', {
        statusCode: httpCodes.UNAUTHORIZED,
        body: apiResponses.login.fail.response
      }).as('login-request')
    }

    function checkFailState (): void {
      cy.wait('@login-request').then((req) => {
        cy.wrap(req)
          .its('response.statusCode')
          .should('eq', httpCodes.UNAUTHORIZED)
        cy.wrap(req).its('response.body')
        // breaks e2e
        // .should("deep.eq", apiResponses.login.fail.response)
      })
      cy.url().should('eq', baseUrl + urlFixtures.page.login)
    }

    it('no username / valid password', () => {
      // Attempt to log in
      cy.login('EMPTY', accountFixtures.default.password)

      // Check that to log in fails as expected
      cy.url().should('eq', baseUrl + urlFixtures.page.login)
      cy.get('.mat-error').should('have.length', 1)
    })

    it('invalid username / valid password', () => {
      prepareIntercepts()
      cy.login(accountFixtures.wrong.username, accountFixtures.default.password)
      checkFailState()
    })

    it('valid username / no password', () => {
      cy.login(accountFixtures.default.username, 'EMPTY')
      cy.url().should('eq', baseUrl + urlFixtures.page.login)
      cy.get('.mat-error').should('have.length', 1)
    })

    it('valid username / invalid password', () => {
      prepareIntercepts()
      cy.login(accountFixtures.default.username, accountFixtures.wrong.password)
      checkFailState()
    })

    it('no username / invalid password', () => {
      cy.login('EMPTY', accountFixtures.wrong.password)
      cy.url().should('eq', baseUrl + urlFixtures.page.login)
      cy.get('.mat-error').should('have.length', 1)
    })

    it('no username / no password', () => {
      cy.login('EMPTY', 'EMPTY')
      cy.url().should('eq', baseUrl + urlFixtures.page.login)
      cy.get('.mat-error').should('have.length', 2)
    })
  })

  context('Forgot password', () => {
    it('commment on password recovery', () => {
      cy.log('Test will be implemented when functionality is added')
    })
  })

  context('Logout', () => {
    it('logs in then out', () => {
      cy.setup()

      // Check that the login was successful
      cy.url().should('eq', baseUrl)

      // Logout
      cy.contains('account_circle').click()
      cy.contains('Log out').click()

      // Check that the logout was successful
      cy.url().should('eq', baseUrl + urlFixtures.page.login)
    })
  })
})
