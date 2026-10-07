/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a device
import { httpCodes } from '../../fixtures/api/httpCodes'
import { empty } from '../../fixtures/api/general'
import { tags } from '../../fixtures/api/tags'

const describeWhenNotCloud = Cypress.expose('CLOUD') ? describe.skip : describe

// ---------------------------- Test section ----------------------------

describeWhenNotCloud('Test Device Creation', () => {
  beforeEach('Setup and login', () => {
    cy.setup()
  })

  beforeEach('Setup intercepts for UI Testing', () => {
    // Stub the get tags request
    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags')

    // Stub the initial get devices request (empty list)
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-devices')

    // Stub the post device request
    cy.myIntercept('POST', 'devices', {
      statusCode: httpCodes.CREATED,
      body: {
        hostname: Cypress.expose('FQDN'),
        friendlyName: 'Test Device',
        username: 'admin',
        guid: '',
        tags: [],
        useTLS: false,
        allowSelfSigned: false
      }
    }).as('post-device')
  })

  it('creates a device with TLS and Allow self-signed cert', () => {
    return cy.env(['AMT_PASSWORD']).then(({ AMT_PASSWORD }) => {
      // Navigate to Devices page
      cy.goToPage('Devices')
      cy.wait('@get-devices')
      cy.wait('@get-tags')

      // Change API response to return the new device after creation
      cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
        statusCode: httpCodes.SUCCESS,
        body: {
          data: [
            {
              hostname: Cypress.expose('DEVICE'),
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
      }).as('get-devices-updated')

      // Click Add New button
      cy.get('button').contains('Add New').click()

      // Fill in the device form with config values
      cy.matTextlikeInputType('[formControlName="hostname"]', Cypress.expose('DEVICE'))
      cy.matTextlikeInputType('[formControlName="friendlyName"]', 'Test Device')
      cy.matTextlikeInputType('[formControlName="username"]', 'admin')
      cy.matTextlikeInputType('[formControlName="password"]', AMT_PASSWORD, { log: false })

      // Enable TLS and Allow self-signed cert
      cy.matCheckboxSet('[formControlName="useTLS"]', true)
      cy.matCheckboxSet('[formControlName="allowSelfSigned"]', true)

      // Submit the form
      cy.get('button[type=submit]').click()

      // Wait for the post request to complete
      cy.wait('@post-device').then((req) => {
        expect(req.response?.statusCode).to.eq(httpCodes.CREATED)
        // Verify the request body contains expected values including TLS settings
        const { password, ...publicBody } = req.request.body
        expect(password === AMT_PASSWORD, 'device password matches configured credential').to.eq(true)
        expect(publicBody).to.include({
          hostname: Cypress.expose('DEVICE'),
          friendlyName: 'Test Device',
          username: 'admin',
          useTLS: true,
          allowSelfSigned: true
        })
      })

      // Wait for the devices list to refresh
      cy.wait('@get-devices-updated').its('response.statusCode').should('eq', httpCodes.SUCCESS)

      // Verify the device appears in the list
      cy.get('mat-cell').contains(Cypress.expose('DEVICE'))
      cy.get('mat-cell').contains('Test Device')
    })
  })
})
