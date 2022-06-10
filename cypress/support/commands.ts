// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="cypress" />
/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../e2e/fixtures/api/apiResponses'
declare global {
  namespace Cypress {
    interface Chainable {
      setup: () => Chainable<Element>
      login: (user: string, password: string) => Chainable<Element>
      myIntercept: (method: string, url: string | RegExp, body: any) => Chainable<Element>
      goToPage: (pageName: string) => Chainable<Element>
      enterCiraInfo: (name: string, format: string, addr: string, user: string) => Chainable<Element>
      enterDomainInfo: (name: string, domain: string, file: Cypress.FileReference, pass: string) => Chainable<Element>
      enterWirelessInfo: (name: string, ssid: string, password: string, authenticationMethod: string, encryptionMethod: string) => Chainable<Element>
      enterProfileInfo: (name: string, activation: string, randAmt: boolean, randMebx: boolean, network: boolean, connection: string, connectionConfig: string) => Chainable<Element>
      setAMTMEBXPasswords: (mode: string, amtPassword: string, mebxPassword: string) => Chainable<Element>
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
    body: {}
  }).as('stats-request')

  // Login
  cy.visit(Cypress.env('BASEURL'))
  const mpsUsername = Cypress.env('MPS_USERNAME')
  const mpsPassword = Cypress.env('MPS_PASSWORD')
  cy.login(mpsUsername, mpsPassword)
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
  cy.get('input').get('[name=username]').clear().type(user)
})

Cypress.Commands.add('enterProfileInfo', (name, admin, randAmt, randMebx, dhcpEnabled, connection, connectionConfig) => {
  cy.get('input').get('[name=profileName]').type(name)
  if (admin === 'ccmactivate') {
    cy.get('mat-select[formcontrolname=activation').click()
    cy.contains('Client Control Mode').click()
  }

  if (!randAmt) {
    cy.get('[data-cy=genAmtPass]').click()
    cy.get('input').get('[formControlName=amtPassword]').type(Cypress.env('AMT_PASSWORD'))
    // cy.get('[data-cy=genStaticAmt').click()
  }

  if (!randMebx) {
    cy.get('[data-cy=genMebxPass]').click()
    // cy.get('[data-cy=genStaticMebx').click()
    if (admin === 'acmactivate') {
      cy.get('input').get('[formControlName=mebxPassword]').type(Cypress.env('MEBX_PASSWORD'))
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
  cy.get('input[type="file"]').selectFile(file, { force: true }) // force true because the file selector is always hidden
  cy.get('input[name="provisioningCertPassword"]').type(pass)
})

Cypress.Commands.add('enterWirelessInfo', (name, ssid, password, authMethod, encryptionMethod) => {
  cy.get('input[name="profileName"]').type(name)
  cy.get('input[name="ssid"]').type(ssid)
  cy.get('input[name="pskPassphrase"]').type(password)
  cy.get('mat-select[formControlName=authenticationMethod]').click().get('mat-option').contains(authMethod).click()
  cy.get('mat-select[formControlName=encryptionMethod]').click().get('mat-option').contains(encryptionMethod).click()
})

// ------------------------- Common Navigation --------------------------

Cypress.Commands.add('goToPage', (pageName) => {
  cy.get('.mat-list-item').contains(pageName).click()
})

Cypress.Commands.add('setAMTMEBXPasswords', (mode, amtPassword, mebxPassword) => {
  // cy.get('[formControlName=generateRandomPassword]').click()
  cy.get('input').get('[formControlName=amtPassword]').type(amtPassword)
  if (mode === 'acmactivate') {
    // cy.get('[formControlName=generateRandomMEBxPassword]').click()
    cy.get('input').get('[formControlName=mebxPassword]').type(mebxPassword)
  }
})

// ------------------------------- Other --------------------------------

Cypress.Commands.add('myIntercept', (method, url, body) => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
    cy.intercept({
      method,
      url
    }, body)
  } else {
    cy.intercept({ method, url })
  }
})
