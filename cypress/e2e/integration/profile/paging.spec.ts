/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Tests the creation of a profile
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { paging } from 'cypress/e2e/fixtures/formEntry/paging'
// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles2')

    cy.goToPage('Profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-profiles')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${paging.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles3')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles4')

    cy.goToPage('Profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-profiles3')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${paging.totalCount}`)
    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles5')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles6')

    cy.goToPage('Profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-profiles5')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${paging.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles5')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles6')

    cy.goToPage('Profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
    cy.wait('@get-profiles5')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${paging.totalCount}`)
    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-first.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
  })
})
