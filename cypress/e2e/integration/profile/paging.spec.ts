/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a profile
import { apiResponses } from '../../fixtures/api/apiResponses'
import { profileFixtures } from '../../fixtures/profile'
// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=25&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles2')

    cy.goToPage('Profiles')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${profileFixtures.totalCount}`)
    cy.wait('@get-profiles')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${profileFixtures.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles3')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=25&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles4')

    cy.goToPage('Profiles')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${profileFixtures.totalCount}`)
    cy.wait('@get-profiles3')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${profileFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${profileFixtures.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles5')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=75&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles6')

    cy.goToPage('Profiles')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${profileFixtures.totalCount}`)
    cy.wait('@get-profiles5')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${profileFixtures.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles5')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=75&$count=true', {
      statusCode: apiResponses.profiles.getAll.forPaging.code,
      body: apiResponses.profiles.getAll.forPaging.response
    }).as('get-profiles6')

    cy.goToPage('Profiles')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${profileFixtures.totalCount}`)
    cy.wait('@get-profiles5')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${profileFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${profileFixtures.totalCount}`)
  })
})
