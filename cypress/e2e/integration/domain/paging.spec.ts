/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Tests the creation of a device
import { apiResponses } from '../../fixtures/api/apiResponses'
import { domainFixtures } from '../../fixtures/domain'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains')

    cy.myIntercept('GET', 'domains?$top=25&$skip=25&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains2')

    cy.goToPage('Domains')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${domainFixtures.totalCount}`)
    cy.wait('@get-domains')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${domainFixtures.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains3')

    cy.myIntercept('GET', 'domains?$top=25&$skip=25&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains4')

    cy.goToPage('Domains')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${domainFixtures.totalCount}`)
    cy.wait('@get-domains3')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${domainFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${domainFixtures.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains5')

    cy.myIntercept('GET', 'domains?$top=25&$skip=75&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains6')

    cy.goToPage('Domains')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${domainFixtures.totalCount}`)
    cy.wait('@get-domains5')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${domainFixtures.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains7')

    cy.myIntercept('GET', 'domains?$top=25&$skip=75&$count=true', {
      statusCode: apiResponses.domains.getAll.forPaging.code,
      body: apiResponses.domains.getAll.forPaging.response
    }).as('get-domains8')

    cy.goToPage('Domains')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${domainFixtures.totalCount}`)
    cy.wait('@get-domains7')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${domainFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${domainFixtures.totalCount}`)
  })
})
