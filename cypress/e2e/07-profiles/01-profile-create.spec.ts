/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 *********************************************************************/

import { ciraFixtures } from '../fixtures/formEntry/cira'
import { ciraConfig } from '../fixtures/api/cira'
import { profiles } from '../fixtures/api/profile'
import { wirelessConfigs } from '../fixtures/api/wireless'
import { noConfigsResponse } from '../fixtures/api/ieee8021x'

describe('Test Profile Creation', () => {
  beforeEach(() => {
    cy.setup()

    // Setup API intercepts with proper mock data
    cy.myIntercept('GET', '**/ciraconfigs*', ciraConfig.getAll.success.response).as('get-configs')
    cy.myIntercept('GET', '**/wirelessconfigs*', wirelessConfigs.getAll.success.response).as('get-wirelessConfigs')
    cy.myIntercept('GET', '**/ieee8021xconfigs*', noConfigsResponse).as('intercept8021xGetAll')
    cy.myIntercept('GET', '**/profiles*', profiles.getAll.success.response).as('get-profiles')
    cy.myIntercept('POST', '**/profiles*', profiles.create.success.response).as('post-profile')
    cy.myIntercept('POST', '**/ciraconfigs*', ciraConfig.create.success.response).as('post-cira')

    // Ensure CIRA config exists (required for profile creation)
    cy.goToPage('CIRA Configs')
    cy.wait('@get-configs')

    cy.get('body').then(($body) => {
      if ($body.text().includes('No CIRA Configs')) {
        cy.log('Creating CIRA config for profile dependency')
        cy.get('button').contains('Add New').click()
        cy.enterCiraInfo(
          ciraFixtures.default.name,
          ciraFixtures.default.format,
          Cypress.env('FQDN'),
          Cypress.env('MPS_USERNAME')
        )
        cy.get('button[type=submit]').click()
        cy.wait('@post-cira', { timeout: 15000 })
        cy.wait(3000)
      } else {
        cy.log('CIRA configs already exist')
      }
    })
  })

  it('creates ACM profile with TLS', () => {
    // Navigate to profiles
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Start profile creation
    cy.get('button').contains('Add New').click()

    // Wait for form dependencies to load
    cy.wait('@get-configs', { timeout: 10000 })
    cy.wait('@get-wirelessConfigs', { timeout: 10000 })
    cy.wait('@intercept8021xGetAll', { timeout: 10000 })
    cy.wait(3000)

    // Fill profile form
    cy.matTextlikeInputType('[formControlName="profileName"]', 'acm-dhcp-tls-test')
    cy.matSelectChooseByValue('[formControlName="activation"]', 'acmactivate')
    cy.matCheckboxSet('[formControlName="generateRandomPassword"]', true)
    cy.matCheckboxSet('[formControlName="generateRandomMEBxPassword"]', true)
    cy.matCheckboxSet('[formControlName="iderEnabled"]', false)
    cy.matCheckboxSet('[formControlName="kvmEnabled"]', false)
    cy.matCheckboxSet('[formControlName="solEnabled"]', false)
    cy.matSelectChoose('[formControlName="userConsent"]', 'All')
    cy.matRadioButtonChoose('[formControlName="dhcpEnabled"]', 'true')

    // Set TLS connection
    cy.get('[data-cy="radio-tls"]').click()
    cy.matSelectChooseByValue('[formControlName="tlsMode"]', '1')

    // Submit the profile
    cy.get('button[type=submit]').should('not.be.disabled').click()

    // Handle confirmation dialogs
    cy.get('button').contains('Continue').click()

    // Wait for API call and verify success
    cy.wait('@post-profile', { timeout: 20000 })

    // Verify navigation back to profiles list
    cy.url({ timeout: 10000 }).should('include', '/profiles')
    cy.url().should('not.include', '/create')

    // Wait for profiles to reload and verify the profile appears
    cy.wait('@get-profiles', { timeout: 10000 })
    cy.wait(2000)

    // Check that profile appears in the list (more lenient for mock mode)
    cy.get('body').then(($body) => {
      // In ISOLATE mode (mocked), we may not see the new profile in the list
      // because the subsequent GET call returns fixture data
      if (Cypress.env('ISOLATE') === 'Y') {
        cy.log('✅ Profile creation completed in mock mode')
      } else {
        if ($body.text().includes('No Profiles')) {
          cy.log('❌ No profiles found after creation')
          throw new Error('Profile acm-dhcp-tls-test was not created properly')
        } else {
          cy.get('mat-cell').should('contain', 'acm-dhcp-tls-test')
        }
      }
    })
  })

  it('creates ACM profile with CIRA', () => {
    // Navigate to profiles
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Start profile creation
    cy.get('button').contains('Add New').click()

    // Wait for form dependencies to load
    cy.wait('@get-configs', { timeout: 10000 })
    cy.wait('@get-wirelessConfigs', { timeout: 10000 })
    cy.wait('@intercept8021xGetAll', { timeout: 10000 })
    cy.wait(3000)

    // Fill profile form
    cy.matTextlikeInputType('[formControlName="profileName"]', 'acm-dhcp-cira-test')
    cy.matSelectChooseByValue('[formControlName="activation"]', 'acmactivate')
    cy.matCheckboxSet('[formControlName="generateRandomPassword"]', true)
    cy.matCheckboxSet('[formControlName="generateRandomMEBxPassword"]', true)
    cy.matCheckboxSet('[formControlName="iderEnabled"]', false)
    cy.matCheckboxSet('[formControlName="kvmEnabled"]', false)
    cy.matCheckboxSet('[formControlName="solEnabled"]', false)
    cy.matSelectChoose('[formControlName="userConsent"]', 'All')
    cy.matRadioButtonChoose('[formControlName="dhcpEnabled"]', 'true')

    // Set CIRA connection
    cy.get('[data-cy="radio-cira"]').click()

    // Select the first available CIRA config instead of hardcoding 'happyPath'
    cy.get('[formControlName="ciraConfigName"]').click()
    cy.get('mat-option').first().click()

    // Submit the profile
    cy.get('button[type=submit]').should('not.be.disabled').click()

    // Handle confirmation dialogs
    cy.get('button').contains('Continue').click()

    // Wait for API call and verify success
    cy.wait('@post-profile', { timeout: 20000 })

    // Verify navigation back to profiles list
    cy.url({ timeout: 10000 }).should('include', '/profiles')
    cy.url().should('not.include', '/create')

    // Wait for profiles to reload and verify the profile appears
    cy.wait('@get-profiles', { timeout: 10000 })
    cy.wait(2000)

    // Check that profile appears in the list (more lenient for mock mode)
    cy.get('body').then(($body) => {
      // In ISOLATE mode (mocked), we may not see the new profile in the list
      // because the subsequent GET call returns fixture data
      if (Cypress.env('ISOLATE') === 'Y') {
        cy.log('✅ Profile creation completed in mock mode')
      } else {
        if ($body.text().includes('No Profiles')) {
          cy.log('❌ No profiles found after creation')
          throw new Error('Profile acm-dhcp-cira-test was not created properly')
        } else {
          cy.get('mat-cell').should('contain', 'acm-dhcp-cira-test')
        }
      }
    })
  })

  it('creates CCM profile with TLS', () => {
    // Navigate to profiles
    cy.goToPage('Profiles')
    cy.wait('@get-profiles')

    // Start profile creation
    cy.get('button').contains('Add New').click()

    // Wait for form dependencies to load
    cy.wait('@get-configs', { timeout: 10000 })
    cy.wait('@get-wirelessConfigs', { timeout: 10000 })
    cy.wait('@intercept8021xGetAll', { timeout: 10000 })
    cy.wait(3000)

    // Fill profile form
    cy.matTextlikeInputType('[formControlName="profileName"]', 'ccm-dhcp-tls-test')
    cy.matSelectChooseByValue('[formControlName="activation"]', 'ccmactivate')
    cy.matCheckboxSet('[formControlName="generateRandomPassword"]', true)
    cy.matCheckboxSet('[formControlName="generateRandomMEBxPassword"]', true)
    cy.matCheckboxSet('[formControlName="iderEnabled"]', false)
    cy.matCheckboxSet('[formControlName="kvmEnabled"]', false)
    cy.matCheckboxSet('[formControlName="solEnabled"]', false)
    cy.matRadioButtonChoose('[formControlName="dhcpEnabled"]', 'true')

    // Set TLS connection
    cy.get('[data-cy="radio-tls"]').click()
    cy.matSelectChooseByValue('[formControlName="tlsMode"]', '1')

    // Submit the profile
    cy.get('button[type=submit]').should('not.be.disabled').click()

    // Handle confirmation dialogs
    cy.get('button').contains('Continue').click()

    // Wait for API call and verify success
    cy.wait('@post-profile', { timeout: 20000 })

    // Verify navigation back to profiles list
    cy.url({ timeout: 10000 }).should('include', '/profiles')
    cy.url().should('not.include', '/create')

    // Wait for profiles to reload and verify the profile appears
    cy.wait('@get-profiles', { timeout: 10000 })
    cy.wait(2000)

    // Check that profile appears in the list (more lenient for mock mode)
    cy.get('body').then(($body) => {
      // In ISOLATE mode (mocked), we may not see the new profile in the list
      // because the subsequent GET call returns fixture data
      if (Cypress.env('ISOLATE') === 'Y') {
        cy.log('✅ Profile creation completed in mock mode')
      } else {
        if ($body.text().includes('No Profiles')) {
          cy.log('❌ No profiles found after creation')
          throw new Error('Profile ccm-dhcp-tls-test was not created properly')
        } else {
          cy.get('mat-cell').should('contain', 'ccm-dhcp-tls-test')
        }
      }
    })
  })
})
