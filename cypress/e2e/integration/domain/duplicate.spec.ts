/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { domains } from 'cypress/e2e/fixtures/api/domain'
import { empty } from 'cypress/e2e/fixtures/api/general'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { domainFixtures } from 'cypress/e2e/fixtures/formEntry/domain'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('before', () => {
    cy.setup()
  })

  it('tests to ensure a duplicate domain name cannot be created', () => {
    // Stub the get and post requests
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-domains')

    cy.myIntercept('POST', 'domains', {
      statusCode: httpCodes.CREATED,
      body: domains.create.success.response
    }).as('post-domain')

    cy.goToPage('Domains')
    cy.wait('@get-domains')

    // Fill out the profile
    cy.get('button').contains('Add New').click()

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.success.response
    }).as('get-domains2')

    // handle file on disk or in-memory file
    const certFixtureData: Cypress.FileReference = {
      fileName: 'test-cert.pfx',
      contents: Cypress.Buffer.from(Cypress.env('PROVISIONING_CERT'), 'base64')
    }

    cy.enterDomainInfo(
      domainFixtures.default.profileName,
      Cypress.env('DOMAIN_SUFFIX'),
      certFixtureData,
      Cypress.env('PROVISIONING_CERT_PASSWORD')
    )

    cy.get('button').contains('SAVE').click()
    cy.wait('@post-domain')
    cy.wait('@get-domains2').its('response.statusCode').should('eq', httpCodes.SUCCESS)
    cy.get('mat-cell').contains(domainFixtures.default.profileName)
    cy.get('mat-cell').contains(Cypress.env('DOMAIN_SUFFIX'))

    // Attempt to create a duplicate domain
    cy.get('button').contains('Add New').click()

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.success.response
    }).as('get-domains2')

    // Enter data for duplicate domain
    cy.enterDomainInfo(
      domainFixtures.default.profileName,
      Cypress.env('DOMAIN_SUFFIX'),
      certFixtureData,
      Cypress.env('PROVISIONING_CERT_PASSWORD')
    )

    // Intercept call to create duplicate domain and return error code
    cy.myIntercept('POST', 'domains', {
      statusCode: httpCodes.BAD_REQUEST,
      body: domains.create.failure.response
    }).as('post-domain3')

    // Attempt to save the duplicate domain name
    cy.get('button').contains('SAVE').click()
    cy.wait('@post-domain3').its('response.statusCode').should('eq', httpCodes.BAD_REQUEST)
    // Check that the config was unsuccessful
    cy.contains('Suffix already exists')
    cy.get('button').contains('CANCEL').click()
  })

  it('tests to ensure a duplicate domain suffix cannot be created', () => {
    // Stub the get and post requests
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-domains')

    cy.myIntercept('POST', 'domains', {
      statusCode: httpCodes.CREATED,
      body: domains.create.success.response
    }).as('post-domain')

    cy.goToPage('Domains')
    cy.wait('@get-domains')

    // Fill out the profile
    cy.get('button').contains('Add New').click()

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.success.response
    }).as('get-domains2')

    // handle file on disk or in-memory file
    const certFixtureData: Cypress.FileReference = {
      fileName: 'test-cert.pfx',
      contents: Cypress.Buffer.from(Cypress.env('PROVISIONING_CERT'), 'base64')
    }

    cy.enterDomainInfo(
      domainFixtures.default.profileName + '2',
      Cypress.env('DOMAIN_SUFFIX'),
      certFixtureData,
      Cypress.env('PROVISIONING_CERT_PASSWORD')
    )

    cy.myIntercept('POST', 'domains', {
      statusCode: httpCodes.BAD_REQUEST,
      body: domains.create.failure.response
    }).as('get-domain3')

    cy.get('button').contains('SAVE').click()
    cy.wait('@get-domain3').its('response.statusCode').should('eq', httpCodes.BAD_REQUEST)
    // Check that the config was unsuccessful
    cy.contains('Suffix already exists')
    cy.get('button').contains('CANCEL').click()

    // Clean up domain created
    cy.myIntercept('DELETE', /.*domains.*/, {
      statusCode: httpCodes.NO_CONTENT,
      body: domains.delete.success.response
    }).as('delete-domain')

    cy.goToPage('Domains')

    // Delete Domain (but cancel)
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()

    // Check that the domain was not deleted
    cy.get('mat-cell').contains(domainFixtures.default.profileName)
    cy.get('mat-cell').contains(Cypress.env('DOMAIN_SUFFIX'))

    // Change api response
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: empty.response
    }).as('get-domain4')

    // Delete Domain
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('Yes').click()
    cy.wait('@delete-domain')
    cy.wait('@get-domain4')

    // Check that the Domain was deleted properly
    cy.contains(domainFixtures.default.profileName).should('not.exist')
    cy.contains(Cypress.env('DOMAIN_SUFFIX')).should('not.exist')
  })
})
