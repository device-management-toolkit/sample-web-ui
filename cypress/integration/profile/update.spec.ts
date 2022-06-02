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
    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerNonTLS
    }).as('save-profile')
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerNonTLS
    }).as('get-profiles')

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.setAMTMEBXPasswords('acmactivate', Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.get('[formControlName=connectionMode]').contains('TLS').click()
    cy.get('[formControlName=tlsMode]').scrollIntoView().click().get('mat-option').contains('Server & Non-TLS Authentication').click()
    cy.contains('SAVE').scrollIntoView().click()
    cy.wait('@save-profile')

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('Server & Non-TLS Authentication').should('exist')
  })
  it('Update profile to Admin Control Mode', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })
    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerAuthentication
    }).as('save-profile')
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchServerAuthentication
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.get('mat-select[formcontrolname=activation').click().get('mat-option').contains('Admin Control Mode').click()
    cy.setAMTMEBXPasswords('acmactivate', Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.contains('SAVE').click()
    cy.wait('@save-profile')

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('Admin Control Mode').should('exist')
  })
  it('Update profile with WirelessConfig', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })
    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchWirelessConfigHappyPath
    }).as('save-profile')

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.setAMTMEBXPasswords('ccmactivate', Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.get('[data-placeholder="Search for Wi-Fi Profiles to Add"]').type(`${wirelessFixtures.happyPath.profileName}{enter}`)
    cy.wait('@get-wirelessConfigs')
    cy.contains('SAVE').click()
    cy.wait('@save-profile')
  })
  it('Update profile\'s Network Configuration to STATIC', () => {
    cy.myIntercept('GET', 'happyTlspath', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.happyPathTls
    })
    cy.myIntercept('PATCH', 'profiles', {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchSTATIC
    }).as('save-profile')

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.setAMTMEBXPasswords('ccmactivate', Cypress.env('AMT_PASSWORD'), Cypress.env('MEBX_PASSWORD'))
    cy.contains('STATIC').click()
    cy.contains('SAVE').click()
    cy.wait('@save-profile')

    cy.myIntercept('GET', profileFixtures.happyPathTls.profileName, {
      statusCode: httpCodes.SUCCESS,
      body: profileFixtures.patchSTATIC
    })

    cy.get('mat-row').contains(profileFixtures.happyPathTls.profileName).click()
    cy.contains('STATIC').parent().should('have.class', 'mat-radio-checked')
  })
})
