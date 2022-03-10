/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { eventLogFixtures } from '../../fixtures/eventlogs'

describe('Test event logs page', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('loads all the eventlogs', () => {
    cy.myIntercept('GET', /.*event.*/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.eventLogs.getAll.success.response
    }).as('get-logs')

    cy.myIntercept('GET', /.*version.*/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.eventLogs.version.success.response
    }).as('get-version')

    cy.myIntercept('GET', /.*hardwareInfo.*/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.eventLogs.hardwareInfo.success.response
    }).as('get-hwInfo')

    cy.myIntercept('GET', /.*audit.*/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.eventLogs.auditlog.success.response
    }).as('get-auditlog')

    cy.myIntercept('GET', /.*features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.eventLogs.amtFeatures.success.response
    }).as('get-features')

    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.eventLogs.devices.success.response
    }).as('get-devices')

    cy.myIntercept('GET', /.*tags.*/, {
      statusCode: 200,
      body: ['Windows', 'Linux']
    }).as('get-tags')

    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    cy.wait('@get-tags').its('response.statusCode').should('eq', 200)

    cy.get('mat-row').click()

    cy.wait('@get-hwInfo').its('response.statusCode').should('eq', 200)
    cy.wait('@get-version').its('response.statusCode').should('eq', 200)
    cy.wait('@get-auditlog').its('response.statusCode').should('eq', 200)
    cy.wait('@get-features').its('response.statusCode').should('eq', 200)

    cy.get('div[role=tab]').eq(1).click()
    cy.wait(1000)
    cy.get('button').contains('See All Activity').click()
    cy.wait('@get-logs').its('response.statusCode').should('eq', 200)

    cy.get('mat-cell').contains(eventLogFixtures.happyPath.Desc)
    cy.get('mat-cell').contains(eventLogFixtures.happyPath.EventType)
  })
})
