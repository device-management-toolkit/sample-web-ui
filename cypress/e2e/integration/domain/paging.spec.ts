/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Tests the creation of a device
import { domains } from 'cypress/e2e/fixtures/api/domain'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { paging } from 'cypress/e2e/fixtures/formEntry/paging'

// ---------------------------- Test section ----------------------------

describe('Test Domain Page', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains')

    cy.myIntercept('GET', 'domains?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains2')

    cy.goToPage('Domains')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-domains')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${paging.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains3')

    cy.myIntercept('GET', 'domains?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains4')

    cy.goToPage('Domains')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-domains3')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${paging.totalCount}`)
    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains5')

    cy.myIntercept('GET', 'domains?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains6')

    cy.goToPage('Domains')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-domains5')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${paging.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'domains?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains7')

    cy.myIntercept('GET', 'domains?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: domains.getAll.forPaging.response
    }).as('get-domains8')

    cy.goToPage('Domains')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-domains7')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${paging.totalCount}`)
    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-first.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
  })
})
