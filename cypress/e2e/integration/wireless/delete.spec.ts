/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { wirelessConfigs } from 'cypress/e2e/fixtures/api/wireless'
import { wirelessFixtures } from 'cypress/e2e/fixtures/formEntry/wireless'

describe('test wireless profiles page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('deletes the default profile', () => {
    cy.myIntercept('DELETE', /.*wirelessconfigs.*/, {
      statusCode: httpCodes.NO_CONTENT
    }).as('delete-profile')
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: wirelessConfigs.getAll.success.response
    }).as('get-wireless')

    cy.goToPage('Wireless')
    cy.wait('@get-wireless')

    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    cy.get('mat-cell').contains(wirelessFixtures.happyPath.profileName)
    cy.get('mat-cell').contains(wirelessFixtures.happyPath.authenticationMethod)
    cy.get('mat-cell').contains(wirelessFixtures.happyPath.encryptionMethod)

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-wireless2')

    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-profile')
    cy.wait('@get-wireless2')

    cy.contains(wirelessFixtures.happyPath.profileName).should('not.exist')
  })
})
