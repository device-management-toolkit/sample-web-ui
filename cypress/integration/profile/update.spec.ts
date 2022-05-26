/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the update of a profile
import { profileFixtures } from '../../fixtures/profile'
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { wirelessFixtures } from 'cypress/fixtures/wireless'
// ---------------------------- Test section ----------------------------

describe('Test Update Profile Page', () => {
  // Real stack execution order: profile/create-tls.spec.ts, wireless/create.spec.ts and then profile/update-tls.spec.ts
  beforeEach('clear cache and login', () => {
    cy.setup()
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.profiles.getAll.success.response
    }).as('get-profiles')

    // Stub the get and post requests
    cy.myIntercept('GET', 'ciraconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.ciraConfigs.getAll.forProfile.response
    }).as('get-configs')

    cy.myIntercept('GET', 'wirelessconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.wirelessConfigs.getAll.forProfile.response
    }).as('get-wirelessConfigs')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    }).as('get-profile')
  })
  it('Update profile TLS Mode to Server and Non-TLS Authentication', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.setAMTMEBXPasswords(Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.get('mat-select[formcontrolname=tlsMode]').click({ force: true })
    cy.contains('Server & Non-TLS Authentication').click({ force: true })
    cy.contains('SAVE').click({ force: true })

    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerNonTLS
    })
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerNonTLS
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('Server & Non-TLS Authentication').should('exist')
  })
  it('Update profile to Admin Control Mode', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.get('mat-select[formcontrolname=activation').click()
    cy.contains('Admin Control Mode').click({ force: true })
    cy.setAMTMEBXPasswords(Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.contains('SAVE').click({ force: true })

    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerAuthentication
    })
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerAuthentication
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('Admin Control Mode').should('exist')
  })
  it('Update profile with WirelessConfig', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.setAMTMEBXPasswords(Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.get('[data-placeholder="Search for Wi-Fi Profiles to Add"]').type(`${wirelessFixtures.happyPath.profileName}{enter}`)
    cy.contains('SAVE').click({ force: true })

    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchWirelessConfigHappyPath
    })
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchWirelessConfigHappyPath
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('1. happyPath').should('exist')
  })
  it('Update profile\'s Network Configuration to STATIC', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.setAMTMEBXPasswords(Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.contains('STATIC').click({ force: true })
    cy.contains('SAVE').click()

    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchSTATIC
    })
    cy.myIntercept('GET', profileFixtures.happyPathTls.profileName, {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchSTATIC
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('STATIC').parent().should('have.class', 'mat-radio-checked')
  })
})
