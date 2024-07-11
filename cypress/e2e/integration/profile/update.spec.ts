/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the update of a profile
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
// import { profileFixtures } from 'cypress/e2e/fixtures/formEntry/profile'
// ---------------------------- Test section ----------------------------

describe('Test Update Profile Page', () => {
  // Real stack execution order: profile/create-tls.spec.ts, wireless/create.spec.ts and then profile/update-tls.spec.ts
  beforeEach('clear cache and login', () => {
    cy.setup()
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles')

    // Stub the get and post requests
    cy.myIntercept('GET', 'ciraconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.forProfile.response
    }).as('get-configs')

    cy.myIntercept('GET', 'wirelessconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.forProfile.response
    }).as('get-wirelessConfigs')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')
  })
  // it('Update profile should succeed', () => {
  //   cy.myIntercept('GET', /profiles\/.*$/, {
  //     statusCode: httpCodes.SUCCESS,
  //     body: profiles.getAll.success.response.data[0]
  //   }).as('get-profiles')

  //   cy.myIntercept('PATCH', 'profiles', {
  //     statusCode: httpCodes.SUCCESS,
  //     body: profileFixtures.patchServerNonTLS
  //   }).as('save-profile')

  //   cy.get('mat-row').first().click()
  //   // idk -- grab the last one in the list, should be different enough
  //   const updatedAMTProfile = profiles.getAll.success.response.data[profiles.getAll.success.response.data.length - 1]
  //   cy.enterProfileInfo(
  //     updatedAMTProfile.profileName,
  //     updatedAMTProfile.activation,
  //     false,
  //     false,
  //     updatedAMTProfile.dhcpEnabled,
  //     updatedAMTProfile.connectionMode,
  //     updatedAMTProfile.ciraConfigName ?? updatedAMTProfile.tlsConfig,
  //     updatedAMTProfile.userConsent,
  //     updatedAMTProfile.iderEnabled,
  //     updatedAMTProfile.kvmEnabled,
  //     updatedAMTProfile.solEnabled,
  //     updatedAMTProfile.wifiConfigs
  //   )
  //   cy.get('button[type=submit]').click()

  //   cy.wait('@save-profile').then((req) => {
  //     cy.wrap(req)
  //       .its('response.statusCode')
  //       .should('eq', httpCodes.SUCCESS)

  //     // // Check that the config was successful
  //     // cy.get('mat-cell').contains(updatedAMTProfile.profileName)
  //     // // cy.get('mat-cell').contains(profileFixtures.check.network.dhcp.toString())
  //     // cy.get('mat-cell').contains(updatedAMTProfile.ciraConfig ?? updatedAMTProfile.tlsConfig)
  //     // cy.get('mat-cell').contains(updatedAMTProfile.activation)
  //   })
  // })
})
