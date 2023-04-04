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
import * as api8021x from '../../fixtures/api/ieee8021x'

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

    api8021x
      .interceptGetAll(httpCodes.SUCCESS, api8021x.allConfigsResponse)
      .as('intercept8021xGetAll')

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

    cy.get('button').contains('Add New').click()
    cy.wait('@get-configs')
    cy.wait('@get-wirelessConfigs')
    cy.wait('@intercept8021xGetAll')
  })

  amtProfiles.forEach((amtProfile) => {
    let connectProfile: any
    if (amtProfile.ciraConfigName) {
      connectProfile = amtProfile.ciraConfigName
    } else if (amtProfile.tlsConfig) {
      connectProfile = amtProfile.tlsConfig
    }
    it(`creates the profile - ${amtProfile.profileName as string}`, () => {
      cy.log(amtProfile)
      cy.enterProfileInfo(
        amtProfile.profileName,
        amtProfile.activation,
        false,
        false,
        amtProfile.dhcpEnabled,
        amtProfile.connectionMode,
        connectProfile,
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
      })
    })
  })
})
