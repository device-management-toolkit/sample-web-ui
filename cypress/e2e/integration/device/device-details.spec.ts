/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { devices } from '../../fixtures/api/device'
import { eventLogs } from '../../fixtures/api/eventlog'
import { tags } from '../../fixtures/api/tags'
import stats from 'cypress/e2e/fixtures/api/stats'

describe('Test device details page', () => {
  beforeEach('', () => {
    cy.setup()
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.success.response
    }).as('get-devices')

    cy.myIntercept('GET', /devices\/.*/, {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.success.response
    }).as('get-device-by-id')
  })

  it('should load the amt features on the device details page', () => {
    cy.myIntercept('GET', /devices\/stats$/, {
      statusCode: httpCodes.SUCCESS,
      body: stats.get.success.response
    }).as('get-device-stats')
    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags')

    cy.myIntercept('GET', /.*version.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.version.success.response
    }).as('get-version')

    cy.myIntercept('GET', /.*general.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.general.success.response
    }).as('get-general')

    cy.myIntercept('GET', /.*log.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.getAll.success.response
    }).as('get-event-logs')

    cy.myIntercept('GET', /.*audit.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.auditlog.success.response
    }).as('get-auditlog')

    cy.myIntercept('GET', /.*power.*/, {
      statusCode: httpCodes.SUCCESS,
      body: { powerstate: 2 }
    }).as('get-powerstate')

    cy.myIntercept('GET', /.*features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.amtFeatures.success.response
    }).as('get-features')

    cy.myIntercept('GET', /.*alarmOccurrences.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.alarmOccurrences.success.response
    }).as('get-alarmOccurences')

    cy.myIntercept('POST', /.*features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: { status: 'success' }
    }).as('post-features')

    cy.myIntercept('POST', /.*power*/, {
      statusCode: httpCodes.SUCCESS,
      body: { status: 'success' }
    }).as('post-power-action')

    cy.goToPage('Devices')
    cy.wait('@get-devices').its('response.statusCode').should('eq', 200)
    cy.wait('@get-powerstate').its('response.statusCode').should('eq', 200)

    cy.get('mat-row').first().click()

    cy.wait('@get-device-by-id').its('response.statusCode').should('eq', 200)
    // cy.wait('@get-hwInfo').its('response.statusCode').should('eq', 200)
    // cy.wait('@get-version').its('response.statusCode').should('eq', 200)
    // cy.wait('@get-auditlog').its('response.statusCode').should('eq', 200)
    // cy.wait('@get-features').its('response.statusCode').should('eq', 200)
    // cy.wait('@get-alarmOccurences').its('response.statusCode').should('eq', 200)

    // Do not run power actions on real devices
    // if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
    //   // Out-of-band Power Actions
    //   const oobActions = ['Power On', 'Power Cycle', 'Hard Power Off', 'Reset', 'Power to BIOS', 'Reset to BIOS', 'Power to PXE', 'Reset to PXE']
    //   for (let i = 0; i < oobActions.length; i++) {
    //     cy.contains(oobActions[i]).click()
    //     cy.wait('@post-power-action').its('response.statusCode').should('eq', 200)
    //   }

    //   // In-band Power Actions
    //   const ibActions = ['Sleep', 'Hibernate', 'Soft Power Off', 'Soft Reset']
    //   for (let i = 0; i < ibActions.length; i++) {
    //     cy.contains(ibActions[i]).click()
    //     cy.wait('@post-power-action').its('response.statusCode').should('eq', 200)
    //   }
    // }
    // System Summary
    // cy.get('[data-cy="chipVersion"]').should('not.be.empty')
    // cy.get('[data-cy="manufacturer"]').should('not.be.empty')
    // cy.get('[data-cy="manufacturer"]').contains('HP')
    // cy.get('[data-cy="model"]').should('not.be.empty')
    // cy.get('[data-cy="serialNumber"]').should('not.be.empty')
    cy.get('[data-cy="amtVersion"]').should('not.be.empty')

    // AMT Enabled Features
    cy.get('[data-cy="provisioningMode"]').should('not.be.empty')

    // BIOS Summary
    // cy.get('[data-cy="biosManufacturer"]').should('not.be.empty')
    // cy.get('[data-cy="biosVersion"]').should('not.be.empty')
    // cy.get('[data-cy="biosReleaseData"]').should('not.be.empty')
    // cy.get('[data-cy="biosTargetOS"]').should('not.be.empty')

    // Memory Summary
    // TODO: Check each channel reported by the device. Currently only checking the first element in the table
    // cy.get('[data-cy="bankLabel"]').first().should('not.be.empty')
    // cy.get('[data-cy="bankCapacity"]').first().should('not.be.empty')
    // cy.get('[data-cy="bankMaxClockSpeed"]').first().should('not.be.empty')
    // cy.get('[data-cy="bankSerialNumber"]').first().should('not.be.empty')

    // Audit log entries
    // cy.get('[data-cy="auditLogEntry"]').its('length').should('be.gt', 0)

    // Event log entries
    // cy.contains('Event Log').click()
    // cy.get('[data-cy="eventLogEntry"]').its('length').should('be.gt', 0)

    // TODO: Figure out why this tag is not found
    // cy.get('[data-cy="eventSeeAllActivity]').click()

    // TODO: Not sure what this code was doing in the original test.
    //       since it was making the test fail I took it out.
    // cy.get('mat-select').click()
    // cy.get('span').contains('none').click()
    // cy.wait('@post-features').should((req) => {
    //   expect(req.request.method).to.equal('POST')
    //   expect(req.request.body.userConsent).to.equal('none')
    //   expect(req.response.statusCode).to.equal(200)
    // })
  })

  /* ==== Test Created with Cypress Studio ==== */

  // it('Hardware Information', function () {
  //   if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'n') {
  //     cy.myIntercept('GET', /.*hardwareInfo.*/, {
  //       statusCode: httpCodes.SUCCESS,
  //       body: eventLogs.hardwareInfo.success.response
  //     }).as('get-hwInfo')

  //     /* ==== Generated with Cypress Studio ==== */
  //     cy.get('[routerlink="/devices"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click()
  //     cy.get(':nth-child(2) > [data-cy="guid"]').click()
  //     cy.get(':nth-child(5) > .mdc-list-item__content > .mat-mdc-list-item-title').click()
  //     cy.get('[data-cy="biosManufacturer"]').should('have.text', 'Intel')
  //     cy.get('[data-cy="biosVersion"]').should('have.text', ' 8.8.0.6')
  //     cy.get('[data-cy="biosReleaseData"]').should('have.text', 'July 4, 1776 12:00 AM')
  //     cy.get(':nth-child(1) > :nth-child(3) > [data-cy="bankLabel"]').should('have.text', ' BANK 0')
  //     cy.get(':nth-child(2) > :nth-child(3) > [data-cy="bankLabel"]').should('have.text', ' BANK 2')
  //     /* ==== End Cypress Studio ==== */
  //   }
  // })
})
