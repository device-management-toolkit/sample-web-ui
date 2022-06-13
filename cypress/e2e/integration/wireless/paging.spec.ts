/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Tests the creation of a wireless
import { apiResponses } from '../../fixtures/api/apiResponses'
import { wirelessFixtures } from '../../fixtures/wireless'

// ---------------------------- Test section ----------------------------

describe('Test Profile Page', () => {
  beforeEach('clear cache and login', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless')

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=25&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless')

    cy.goToPage('Wireless')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${wirelessFixtures.totalCount}`)
    cy.wait('@get-wireless')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${wirelessFixtures.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless3')

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=25&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless4')

    cy.goToPage('Wireless')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${wirelessFixtures.totalCount}`)
    cy.wait('@get-wireless3')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${wirelessFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${wirelessFixtures.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless5')

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=75&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless6')

    cy.goToPage('Wireless')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${wirelessFixtures.totalCount}`)
    cy.wait('@get-wireless5')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${wirelessFixtures.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=0&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless5')

    cy.myIntercept('GET', 'wirelessconfigs?$top=25&$skip=75&$count=true', {
      statusCode: apiResponses.wirelessConfigs.getAll.forPaging.code,
      body: apiResponses.wirelessConfigs.getAll.forPaging.response
    }).as('get-wireless6')

    cy.goToPage('Wireless')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${wirelessFixtures.totalCount}`)
    cy.wait('@get-wireless5')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${wirelessFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${wirelessFixtures.totalCount}`)
  })
})
