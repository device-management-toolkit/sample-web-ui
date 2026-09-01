/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the deletion of a device created in create.spec.ts
import { httpCodes } from '../../fixtures/api/httpCodes'
import { empty } from '../../fixtures/api/general'
import { tags } from '../../fixtures/api/tags'

const describeWhenNotCloud = Cypress.env('CLOUD') ? describe.skip : describe

// Detect auto-add device mode via the same flag used by the RPC helpers
const autoAddDevice = Cypress.env('AUTO_ADD_DEVICE') === true || Cypress.env('AUTO_ADD_DEVICE') === 'true'

// When auto-add device is enabled, device is automatically removed during deactivation,
// so skip the manual deletion tests
const describeWhenNoAutoDelete = autoAddDevice ? describe.skip : describeWhenNotCloud

// ---------------------------- Test section ----------------------------

describeWhenNoAutoDelete('Test Device Deletion', () => {
  beforeEach('Setup and login', () => {
    cy.setup()
  })

  beforeEach('Setup intercepts for UI Testing', () => {
    // Stub the get tags request
    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags')

    // Stub the get devices request returning the device created in create.spec.ts
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: {
        data: [
          {
            hostname: Cypress.env('DEVICE'),
            friendlyName: 'Test Device',
            username: 'admin',
            guid: '123e4567-e89b-12d3-a456-426614174000',
            connectionStatus: 1,
            tags: [],
            useTLS: true,
            allowSelfSigned: true
          }
        ],
        totalCount: 1
      }
    }).as('get-devices')

    // Stub the delete device request
    cy.myIntercept('DELETE', /.*devices.*/, {
      statusCode: httpCodes.NO_CONTENT,
      body: {}
    }).as('delete-device')
  })

  it('should not delete device when cancelled', () => {
    cy.goToPage('Devices')
    cy.wait('@get-devices')
    cy.wait('@get-tags')

    // Verify the device is present
    cy.get('mat-cell').contains(Cypress.env('DEVICE'))
    cy.get('mat-cell').contains('Test Device')

    // Click delete but cancel
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    // Verify the device still exists
    cy.get('mat-cell').contains(Cypress.env('DEVICE'))
    cy.get('mat-cell').contains('Test Device')
  })

  it('should delete the device created in create.spec.ts', () => {
    cy.goToPage('Devices')
    cy.wait('@get-devices')
    cy.wait('@get-tags')

    // Verify the device is present before deletion
    cy.get('mat-cell').contains(Cypress.env('DEVICE'))
    cy.get('mat-cell').contains('Test Device')

    // Change API response to return empty list after deletion
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-devices-after-delete')

    // Scope deletion to this device's row (matched by hostname/IP) so that
    // multiple devices sharing the friendly name are not affected (ISOLATE=N).
    cy.contains('mat-row', Cypress.env('DEVICE')).find('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()

    // Wait for delete and list refresh requests
    cy.wait('@delete-device').then((req) => {
      cy.wrap(req).its('response.statusCode').should('eq', httpCodes.NO_CONTENT)
    })
    cy.wait('@get-devices-after-delete').its('response.statusCode').should('eq', httpCodes.SUCCESS)

    // Only this device (matched by hostname/IP) must be gone; under ISOLATE=N other
    // devices may still carry the shared 'Test Device' friendly name.
    cy.contains(Cypress.env('DEVICE')).should('not.exist')
  })
})
