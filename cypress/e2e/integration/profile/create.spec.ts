/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Tests the creation of a profile
import { ciraConfig } from 'cypress/e2e/fixtures/api/cira'
import { empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
import { amtProfiles } from '../../fixtures/formEntry/profile'

// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
    // Stub the get and post requests
    cy.myIntercept('GET', 'ciraconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: ciraConfig.getAll.forProfile.response
    }).as('get-configs')

    cy.myIntercept('GET', 'wirelessconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.forProfile.response
    }).as('get-wirelessConfigs')

    cy.myIntercept('POST', 'profiles', {
      statusCode: httpCodes.CREATED,
      body: profiles.create.success.response
    }).as('post-profile')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-profiles')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // change api response
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.success.response
    }).as('get-profiles2')

    // Fill out the profile
    cy.get('button').contains('Add New').click()
    cy.wait('@get-configs')
    cy.wait('@get-wirelessConfigs')
  })

  amtProfiles.forEach((amtProfile) => {
    it(`creates the profile - ${amtProfile.profileName as string}`, () => {
      cy.log(amtProfile)
      cy.enterProfileInfo(
        amtProfile.profileName,
        amtProfile.activation,
        false,
        false,
        amtProfile.dhcpEnabled,
        amtProfile.connectionMode,
        amtProfile.ciraConfigName ?? amtProfile.tlsConfig,
        amtProfile.userConsent,
        amtProfile.iderEnabled,
        amtProfile.kvmEnabled,
        amtProfile.solEnabled,
        amtProfile.wifiConfigs
      )
      cy.get('button[type=submit]').click()
      if (!amtProfile.dhcpEnabled && amtProfile.connectionMode === 'CIRA (Cloud)') {
        cy.get('button').contains('Continue').click()
      }
      cy.wait('@post-profile').then((req) => {
        cy.wrap(req)
          .its('response.statusCode')
          .should('eq', httpCodes.CREATED)

        // Check that the config was successful
        // cy.get('mat-cell').contains(amtProfile.profileName)
        // cy.get('mat-cell').contains(profileFixtures.check.network.dhcp.toString())
        // cy.get('mat-cell').contains(amtProfile.ciraConfig)
        // cy.get('mat-cell').contains(amtProfile.activation)
      })
    })
  })
})
