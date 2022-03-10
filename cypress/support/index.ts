/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Add repetitive groups of functions here

import { accountFixtures } from '../fixtures/accounts'
import { httpCodes } from '../fixtures/api/apiResponses'
declare global {
  namespace Cypress {
    interface Chainable {
      setup: () => Chainable<Element>
      login: (user: string, password: string) => Chainable<Element>
      myIntercept: (method: string, url: string | RegExp, body: any) => Chainable<Element>
      goToPage: (pageName: string) => Chainable<Element>
      enterCiraInfo: (name: string, format: string, addr: string, user: string) => Chainable<Element>
      enterDomainInfo: (name: string, domain: string, file: string, pass: string) => Chainable<Element>
      enterWirelessInfo: (name: string, ssid: string, password: string) => Chainable<Element>
      enterProfileInfo: (name: string, activation: string, randAmt: boolean, randMebx: boolean, network: boolean, connection: string, connectionConfig: string) => Chainable<Element>
    }
  }
}

// -------------------- before / beforeEach ---------------------------

Cypress.Commands.add('setup', () => {
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })

  cy.myIntercept('POST', 'authorize', {
    statusCode: httpCodes.SUCCESS,
    body: { token: '' }
  }).as('login-request')

  cy.myIntercept('GET', 'mps/api/v1/devices/stats', {
    statusCode: 200,
    body: { }
  }).as('stats-request')

  // Login
  cy.visit(Cypress.env('BASEURL'))
  cy.login(accountFixtures.default.username, accountFixtures.default.password)
  cy.wait('@login-request')
    .its('response.statusCode')
    .should('eq', httpCodes.SUCCESS)
})

// ------------------- Enter info into a form -------------------------

Cypress.Commands.add('login', (user, pass) => {
  if (user !== 'EMPTY') {
    cy.get('[name=userId]').type(user)
  }
  if (pass !== 'EMPTY') {
    cy.get('[name=Password]').type(pass)
  }
  cy.get('[id=btnLogin]').get('[type=submit]').click()
})

Cypress.Commands.add('enterCiraInfo', (name, format, addr, user) => {
  cy.get('input').get('[name=configName]').type(name)
  if (format === 'FQDN') {
    cy.contains('FQDN').click()
  }
  cy.get('input').get('[name=mpsServerAddress]').type(addr)
  cy.get('input').get('[name=username]').type(user)
})

Cypress.Commands.add('enterProfileInfo', (name, admin, randAmt, randMebx, dhcpEnabled, connection, connectionConfig) => {
  cy.get('input').get('[name=profileName]').type(name)
  if (admin === 'ccmactivate') {
    cy.get('mat-select[formcontrolname=activation').click()
    cy.contains('Client Control Mode').click()
  }

  if (!randAmt) {
    cy.get('[data-cy=genAmtPass]').click()
    cy.get('input').get('[formControlName=amtPassword]').type(Cypress.env('AMTPASSWORD'))
    // cy.get('[data-cy=genStaticAmt').click()
  }

  if (!randMebx) {
    cy.get('[data-cy=genMebxPass]').click()
    // cy.get('[data-cy=genStaticMebx').click()
    if (admin === 'acmactivate') {
      cy.get('input').get('[formControlName=mebxPassword]').type(Cypress.env('MEBXPASSWORD'))
    }
  }

  cy.contains(connection).click()

  if (dhcpEnabled) {
    cy.contains('DHCP').click()
  } else {
    cy.contains('STATIC').click()
  }

  if (connection === 'CIRA (Cloud)') {
    cy.get('mat-select[formcontrolname=ciraConfigName]').click()
  } else if (connection === 'TLS (Enterprise)') {
    cy.get('mat-select[formcontrolname=tlsMode]').click()
  }
  cy.contains(connectionConfig).click()
}
)

Cypress.Commands.add('enterDomainInfo', (name, domain, file, pass) => {
  cy.get('input[name="name"]').type(name)
  cy.get('input[name="domainName"]').type(domain)
  cy.get('input[type="file"]').attachFile(file)
  cy.get('input[name="provisioningCertPassword"]').type(pass)
})

Cypress.Commands.add('enterWirelessInfo', (name, ssid, password) => {
  cy.get('input[name="profileName"]').type(name)
  cy.get('input[name="ssid"]').type(ssid)
  cy.get('input[name="pskPassphrase"]').type(password)
  cy.get('mat-select[formcontrolname=authenticationMethod]').click().get('mat-option').contains('WPA PSK').click()
  cy.get('mat-select[formcontrolname=encryptionMethod]').click().get('mat-option').contains('TKIP').click()
})

// ------------------------- Common Navigation --------------------------

Cypress.Commands.add('goToPage', (pageName) => {
  cy.get('.mat-list-item').contains(pageName).click()
})

// ------------------------------- Other --------------------------------

Cypress.Commands.add('myIntercept', (method, url, body) => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
    cy.intercept(method, url, body)
  } else {
    cy.intercept(method, url)
  }
})

// ------------------------------ Help --------------------------------

// https://on.cypress.io/custom-commands

// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
