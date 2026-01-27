/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { devices } from '../../fixtures/api/device'
import { kvm } from '../../fixtures/api/kvm'

describe('KVM Component E2E Tests', () => {
  const deviceId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    cy.setup()
    
    // Mock generic power state for any device (needed during navigation)
    cy.myIntercept('GET', /.*power.*/, {
      statusCode: httpCodes.SUCCESS,
      body: { powerState: 2 }
    }).as('get-powerstate-generic')
    
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.success.response
    }).as('get-devices')

    cy.myIntercept('GET', `**/api/v1/devices/${deviceId}`, {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.success.response.data[0]
    }).as('get-device-by-id')

    // Mock AMT features for device toolbar
    cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
      statusCode: httpCodes.SUCCESS,
      body: kvm.amtFeatures.kvmEnabled.response
    }).as('get-amt-features-toolbar')

    // Mock redirection token API
    cy.myIntercept('GET', `**/api/v1/authorize/redirection/${deviceId}`, {
      statusCode: httpCodes.SUCCESS,
      body: { token: 'mock-jwt-token' }
    }).as('get-redirection-token')

    // Mock display selection PUT
    cy.myIntercept('PUT', `**/api/v1/amt/kvm/displays/${deviceId}`, {
      statusCode: httpCodes.SUCCESS,
      body: {}
    }).as('set-display-selection')

    // Mock display selection for all tests
    cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, {
      statusCode: httpCodes.SUCCESS,
      body: kvm.displaySelection.success.response
    }).as('get-displays')
  })

  describe('Debug', () => {
    it('should load the KVM page', () => {
      cy.visit(`/#/devices/${deviceId}/kvm`)
      cy.url().should('include', '/devices/')
      cy.url().should('include', '/kvm')
      // Verify component renders
      cy.get('app-kvm').should('exist')
      // Wait for display dropdown to appear (indicates component initialized)
      cy.get('mat-select[data-cy="display-select"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('KVM Initialization Flow', () => {
    it('should initialize KVM with display selection loaded first', () => {
      // Mock power state API
      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOn.response
      }).as('get-power-state')

      // Mock redirection status API
      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      // Navigate to KVM page
      cy.visit(`/#/devices/${deviceId}/kvm`)

      // Verify display selection is loaded first
      cy.wait('@get-displays').then((interception) => {
        expect(interception.response?.statusCode).to.equal(httpCodes.SUCCESS)
      })

      // Verify display dropdown is populated
      cy.get('mat-select[data-cy="display-select"]').should('exist')

      // Verify power state check happens after display load
      cy.wait('@get-power-state').then((interception) => {
        expect(interception.response?.statusCode).to.equal(httpCodes.SUCCESS)
      })

      // Verify other initialization APIs are called
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features-toolbar')
    })

    it('should handle display selection API failure gracefully', () => {
      // Mock display selection API failure
      cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, {
        statusCode: httpCodes.INTERNAL_SERVER_ERROR,
        body: kvm.displaySelection.error.response
      }).as('get-displays-error')

      // Mock other APIs
      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOn.response
      }).as('get-power-state')

      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.kvmEnabled.response
      }).as('get-amt-features')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays-error')

      // Should still proceed with fallback displays
      cy.get('mat-select[data-cy="display-select"]').should('exist')

      // Should continue initialization
      cy.wait('@get-power-state')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features')
    })

    it('should prevent duplicate API calls during initialization', () => {
      let displayCallCount = 0
      let powerCallCount = 0

      cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, (req: any) => {
        displayCallCount++
        req.reply({
          statusCode: httpCodes.SUCCESS,
          body: kvm.displaySelection.success.response
        })
      }).as('get-displays')

      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, (req: any) => {
        powerCallCount++
        req.reply({
          statusCode: httpCodes.SUCCESS,
          body: kvm.powerState.poweredOn.response
        })
      }).as('get-power-state')

      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.kvmEnabled.response
      }).as('get-amt-features')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays')
      cy.wait('@get-power-state')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features')

      // Verify each API was only called once during initialization
      cy.wrap(displayCallCount).should('equal', 1)
      cy.wrap(powerCallCount).should('equal', 1)
    })
  })

  describe('KVM Connect Functionality', () => {
    beforeEach(() => {
      // Setup successful initialization mocks
      cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.displaySelection.success.response
      }).as('get-displays')

      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOn.response
      }).as('get-power-state')

      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.kvmEnabled.response
      }).as('get-amt-features')
    })

    it('should wait for initialization before connecting', () => {
      cy.visit(`/#/devices/${deviceId}/kvm`)

      // Wait for initialization to complete
      cy.wait('@get-displays')
      cy.wait('@get-power-state')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features')

      // Connect button should be enabled after initialization
      cy.get('[data-cy="kvm-connect-button"]').should('not.be.disabled')
      cy.get('[data-cy="kvm-connect-button"]').click()

      // Verify connection is established
      cy.get('[data-cy="kvm-canvas"]').should('be.visible')
    })

    it('should handle user clicking connect during initialization', () => {
      // Add delay to power state to simulate slow API
      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, (req: any) => {
        setTimeout(() => {
          req.reply({
            statusCode: httpCodes.SUCCESS,
            body: kvm.powerState.poweredOn.response
          })
        }, 1000)
      }).as('get-power-state-delayed')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      // Click connect while initialization is in progress
      cy.get('[data-cy="kvm-connect-button"]').click()

      // Wait for initialization to complete
      cy.wait('@get-displays')
      cy.wait('@get-power-state-delayed')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features')

      // Should auto-connect after initialization completes
      cy.get('[data-cy="kvm-canvas"]').should('be.visible')
    })

    it('should show appropriate message when device is powered off', () => {
      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOff.response
      }).as('get-power-state-off')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays')
      cy.wait('@get-power-state-off')

      // Should show power on message
      cy.contains('Your device is not powered on').should('be.visible')
      cy.get('[data-cy="power-on-button"]').should('be.visible')
    })

    it('should handle KVM not available', () => {
      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.kvmDisabled.response
      }).as('get-amt-features-disabled')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays')
      cy.wait('@get-power-state')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features-disabled')

      // Should show KVM not available state - connect button should not be visible
      cy.get('[data-cy="kvm-connect-button"]').should('not.exist')
    })
  })

  describe('User Consent Flow', () => {
    it('should handle user consent requirement', () => {
      cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.displaySelection.success.response
      }).as('get-displays')

      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOn.response
      }).as('get-power-state')

      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.userConsentRequired.response
      }).as('get-amt-features-consent')

      cy.myIntercept('POST', `devices/${deviceId}/userconsent`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.userConsent.granted.response
      }).as('post-user-consent')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays')
      cy.wait('@get-power-state')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features-consent')

      // Should show user consent dialog
      cy.contains('User Consent').should('be.visible')
      cy.get('[data-cy="consent-approve-button"]').click()

      cy.wait('@post-user-consent')

      // Should proceed to connect after consent
      cy.get('[data-cy="kvm-connect-button"]').should('not.be.disabled')
    })
  })

  describe('Display Selection', () => {
    it('should allow switching between available displays', () => {
      cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.displaySelection.success.response
      }).as('get-displays')

      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOn.response
      }).as('get-power-state')

      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.kvmEnabled.response
      }).as('get-amt-features')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays')
      cy.wait('@get-power-state')
      cy.wait('@get-redirection-status')
      cy.wait('@get-amt-features')

      // Open display dropdown
      cy.get('mat-select[data-cy="display-select"]').click()

      // Verify both active displays are selectable
      cy.get('mat-option').should('have.length', 4)
      cy.get('mat-option').eq(0).should('not.have.class', 'mat-option-disabled')
      cy.get('mat-option').eq(1).should('not.have.class', 'mat-option-disabled')
      cy.get('mat-option').eq(2).should('have.class', 'mat-option-disabled')
      cy.get('mat-option').eq(3).should('have.class', 'mat-option-disabled')

      // Select second display
      cy.get('mat-option').eq(1).click()

      // Verify selection changed
      cy.get('mat-select[data-cy="display-select"]').should('contain', 'Display 2')
    })

    it('should default to the default display', () => {
      cy.myIntercept('GET', `**/api/v1/amt/kvm/displays/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.displaySelection.success.response
      }).as('get-displays')

      cy.myIntercept('GET', `**/api/v1/amt/power/state/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.powerState.poweredOn.response
      }).as('get-power-state')

      cy.myIntercept('GET', `**/api/v1/devices/redirectstatus/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.redirectionStatus.available.response
      }).as('get-redirection-status')

      cy.myIntercept('GET', `**/api/v1/amt/features/${deviceId}`, {
        statusCode: httpCodes.SUCCESS,
        body: kvm.amtFeatures.kvmEnabled.response
      }).as('get-amt-features')

      cy.visit(`/#/devices/${deviceId}/kvm`)

      cy.wait('@get-displays')

      // Verify default display (Display 1) is selected
      cy.get('mat-select[data-cy="display-select"]').should('contain', 'Display 1')
    })
  })
})
