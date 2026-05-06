/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { eventLogs } from '../../fixtures/api/eventlog'

const navigateToRemotePlatformErase = (): void => {
  cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.devices.success.response
  }).as('get-devices')

  cy.myIntercept('GET', /devices\/.*$/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.devices.success.response
  }).as('get-device-by-id')

  cy.myIntercept('GET', /devices\/tags/, {
    statusCode: httpCodes.SUCCESS,
    body: []
  }).as('get-tags')

  cy.myIntercept('GET', /.*power.*/, {
    statusCode: httpCodes.SUCCESS,
    body: { powerstate: 2 }
  }).as('get-powerstate')

  cy.myIntercept('GET', /.*general.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.general.success.response
  }).as('get-general')

  cy.myIntercept('GET', /.*version.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.version.success.response
  }).as('get-version')

  cy.myIntercept('GET', /.*alarmOccurrences.*/, {
    statusCode: httpCodes.SUCCESS,
    body: eventLogs.alarmOccurrences.success.response
  }).as('get-alarms')

  cy.goToPage('Devices')
  cy.wait('@get-devices').its('response.statusCode').should('eq', 200)

  cy.get('mat-row').first().click()
  cy.wait('@get-device-by-id').its('response.statusCode').should('eq', 200)

  cy.get('.mat-mdc-list-item-title').contains('Remote Platform Erase').click()
}

describe('Remote Platform Erase', () => {
  beforeEach(() => {
    cy.setup()
  })

  it('should show "not supported" message when remoteEraseSupported is false', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.notSupported.response
    }).as('get-features')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"]').should('not.exist')
    cy.get('mat-icon').contains('info').should('exist')
  })

  it('should show checkbox when supported but not enabled', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"]').should('exist')
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').should('have.attr', 'aria-checked', 'false')
    cy.get('[data-cy="initiateEraseButton"]').should('not.exist')
  })

  it('should show checkbox unchecked even when rpeEnabled is true in API response', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('get-features')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').should('have.attr', 'aria-checked', 'false')
    cy.get('[data-cy="initiateEraseButton"]').should('not.exist')
  })

  it('should enable the feature and show initiate erase button after toggling on', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features').its('request.body.platformEraseEnabled').should('eq', true)

    cy.get('[data-cy="initiateEraseButton"]').should('be.visible')
  })

  it('should disable the feature after toggling off', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features').its('request.body.platformEraseEnabled').should('eq', true)

    // Then disable
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features').its('request.body.platformEraseEnabled').should('eq', false)

    cy.get('[data-cy="initiateEraseButton"]').should('not.exist')
  })

  it('should call the remoteErase API when erase is confirmed in the dialog', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    cy.myIntercept('POST', /.*amt\/remoteErase.*/, {
      statusCode: httpCodes.SUCCESS,
      body: {}
    }).as('post-erase')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable the feature first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features')

    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
    cy.get('[data-cy="initiateEraseButton"]').click()

    cy.get('mat-dialog-container').should('be.visible')
    cy.get('mat-dialog-container').contains('button', 'Yes').click()

    cy.wait('@post-erase').its('response.statusCode').should('eq', 200)
  })

  it('should not call the remoteErase API when erase is cancelled', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    cy.myIntercept('POST', /.*amt\/remoteErase.*/, {
      statusCode: httpCodes.SUCCESS,
      body: {}
    }).as('post-erase')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable the feature first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features')

    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
    cy.get('[data-cy="initiateEraseButton"]').click()

    cy.get('mat-dialog-container').should('be.visible')
    cy.get('mat-dialog-container').contains('button', 'No').click()

    cy.get('@post-erase.all').should('have.length', 0)
  })

  it('should show error snackbar when toggling feature fails', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.INTERNAL_SERVER_ERROR,
      body: {}
    }).as('post-features-error')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features-error')

    cy.get('mat-snack-bar-container').should('be.visible')
  })

  it('should show error snackbar when erase API fails', () => {
    cy.myIntercept('GET', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedDisabled.response
    }).as('get-features')

    cy.myIntercept('POST', /.*amt\/features.*/, {
      statusCode: httpCodes.SUCCESS,
      body: eventLogs.remotePlatformErase.supportedEnabled.response
    }).as('post-features')

    cy.myIntercept('POST', /.*amt\/remoteErase.*/, {
      statusCode: httpCodes.INTERNAL_SERVER_ERROR,
      body: {}
    }).as('post-erase-error')

    navigateToRemotePlatformErase()
    cy.wait('@get-features')

    // Enable the feature first
    cy.get('[data-cy="remoteEraseCheckbox"] button[role="switch"]').click({ force: true })
    cy.wait('@post-features')

    cy.get('[data-cy="eraseCapCheckbox"]').first().find('input[type="checkbox"]').check({ force: true })
    cy.get('[data-cy="initiateEraseButton"]').click()
    cy.get('mat-dialog-container').contains('button', 'Yes').click()

    cy.wait('@post-erase-error')
    cy.get('mat-snack-bar-container').should('be.visible')
  })
})
