/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { devices } from 'cypress/e2e/fixtures/api/device'
import { eventLogs } from 'cypress/e2e/fixtures/api/eventlog'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
// import { eventLogFixtures } from 'cypress/e2e/fixtures/formEntry/eventlogs'

describe('Test event logs page', () => {
  beforeEach('', () => {
    cy.setup()
    cy.myIntercept('GET', /.*power.*/, {
      statusCode: httpCodes.SUCCESS,
      body: { powerstate: 2 }
    }).as('get-powerstate')
    cy.myIntercept('GET', /.*general.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.general.success.response
    }).as('get-general')
  })

  it('loads all the eventlogs', () => {
    cy.myIntercept('GET', /.*event.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.getAll.success.response
    }).as('get-logs')

    cy.myIntercept('GET', /.*version.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.version.success.response
    }).as('get-version')

    cy.myIntercept('GET', /.*hardwareInfo.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.hardwareInfo.success.response
    }).as('get-hwInfo')

    cy.myIntercept('GET', /.*audit.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.auditlog.success.response
    }).as('get-auditlog')

    cy.myIntercept('GET', /.*features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.amtFeatures.success.response
    }).as('get-features')

    cy.myIntercept('GET', /.*alarmOccurrences.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.alarmOccurrences.success.response
    }).as('get-alarmOccurences')

    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.devices.success.response
    }).as('get-devices')

    cy.myIntercept('GET', /devices\/.*$/, {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.success.response
    }).as('get-device-by-id')

    cy.myIntercept('GET', /.*tags.*/, {
      statusCode: 200,
      body: ['Windows', 'Linux']
    }).as('get-tags')

    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    cy.wait('@get-tags').its('response.statusCode').should('eq', 200)

    cy.get('mat-row').click()
    cy.wait('@get-device-by-id').its('response.statusCode').should('eq', 200)

    cy.get('.mat-mdc-list-item-title').contains('Event Log').click()
    // cy.wait(1000)
    // cy.get('button').contains('See All Event Activity').click()
    cy.wait('@get-logs').its('response.statusCode').should('eq', 200)

    // cy.get('mat-cell').contains(eventLogFixtures.happyPath.Desc)
    // cy.get('mat-cell').contains(eventLogFixtures.happyPath.EventType)
  })
})
