/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
// Tests the creation of a device
import { apiResponses, httpCodes } from '../../fixtures/api/apiResponses'
import { deviceFixtures } from '../../fixtures/device'

// ---------------------------- Test section ----------------------------

describe('Test Device Page', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.tags.getAll.success.response
    }).as('get-tags')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices2')

    cy.goToPage('Devices')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${deviceFixtures.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices3')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.tags.getAll.success.response
    }).as('get-tags2')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices4')

    cy.goToPage('Devices')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices3')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-next.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`26 – 50 of ${deviceFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-previous.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices5')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.tags.getAll.success.response
    }).as('get-tags3')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices6')

    cy.goToPage('Devices')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices5')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${deviceFixtures.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices7')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.tags.getAll.success.response
    }).as('get-tags4')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: apiResponses.devices.getAll.forPaging.response
    }).as('get-devices8')

    cy.goToPage('Devices')
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices7')

    cy.get('.mat-paginator').find('button.mat-paginator-navigation-last.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`76 – 100 of ${deviceFixtures.totalCount}`)
    cy.get('.mat-paginator').find('button.mat-paginator-navigation-first.mat-icon-button').click()
    cy.get('.mat-paginator').find('.mat-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
  })
})
