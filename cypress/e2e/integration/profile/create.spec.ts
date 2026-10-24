/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ciraConfig } from '../../fixtures/api/cira'
import { empty } from '../../fixtures/api/general'
import { httpCodes } from '../../fixtures/api/httpCodes'
import { profiles } from '../../fixtures/api/profile'
import { wirelessConfigs } from '../../fixtures/api/wireless'
import { amtProfiles } from '../../fixtures/formEntry/profile'
import * as api8021x from '../../fixtures/api/ieee8021x'

describe('Test Profile Page', () => {
  const disableCira = Cypress.expose('DISABLE_CIRA') === true || Cypress.expose('DISABLE_CIRA') === 'true'

  beforeEach(() => {
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

    cy.myIntercept('GET', 'ieee8021xconfigs?$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: api8021x.wiredConfigsResponse
    }).as('intercept8021xGetAll')

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
    cy.wait('@get-wirelessConfigs')
    cy.wait('@intercept8021xGetAll')
  })

  // When CIRA is disabled on the deployed console, the UI never lets you pick a
  // CIRA config (the dropdown stays disabled), so creating a CIRA-type profile
  // isn't a valid operation to test - skip those cases instead of guessing
  // whether the server actually fetched CIRA configs for this profile.
  amtProfiles
    .filter((amtProfile) => !disableCira || !amtProfile.ciraConfigName)
    .forEach((amtProfile) => {
      it(`creates the profile - ${amtProfile.profileName as string}`, () => {
        cy.log(amtProfile)
        cy.matTextlikeInputType('[formControlName="profileName"]', amtProfile.profileName)

        cy.enterProfileInfoV2(amtProfile)
        cy.get('button[type=submit]').click()
        if (!amtProfile.dhcpEnabled && amtProfile.ciraConfigName) {
          cy.get('button').contains('Continue').click()
        }
        if (amtProfile.generateRandomMEBxPassword || amtProfile.generateRandomPassword) {
          cy.get('button').contains('Continue').click()
        }
        cy.wait('@post-profile').then((req) => {
          cy.wrap(req).its('response.statusCode').should('eq', httpCodes.CREATED)
        })
      })
    })
})
