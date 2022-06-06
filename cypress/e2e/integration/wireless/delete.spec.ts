/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { wirelessFixtures } from '../../fixtures/wireless'

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
      body: apiResponses.wirelessConfigs.getAll.success.response
    }).as('get-wireless')

    cy.goToPage('Wireless')
    cy.wait('@get-wireless')

    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    cy.get('mat-cell').contains(wirelessFixtures.happyPath.profileName)
    cy.get('mat-cell').contains(wirelessFixtures.happyPath.authenticationMethod)
    cy.get('mat-cell').contains(wirelessFixtures.happyPath.encryptionMethod)
    cy.get('mat-cell').contains(wirelessFixtures.happyPath.ssid)

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.wirelessConfigs.getAll.empty.response
    }).as('get-wireless2')

    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-profile')
    cy.wait('@get-wireless2')

    cy.contains(wirelessFixtures.happyPath.profileName).should('not.exist')
  })
})
