/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

// Tests the creation of a device
import { devices } from 'cypress/e2e/fixtures/api/device'
import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { tags } from 'cypress/e2e/fixtures/api/tags'
import { deviceFixtures } from '../../fixtures/formEntry/device'

// ---------------------------- Test section ----------------------------

describe('Test Device Page', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('pagination for next page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices2')

    cy.goToPage('Devices')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${deviceFixtures.totalCount}`)
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices3')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags2')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices4')

    cy.goToPage('Devices')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices3')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${deviceFixtures.totalCount}`)
    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices5')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags3')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices6')

    cy.goToPage('Devices')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices5')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${deviceFixtures.totalCount}`)
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'devices?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices7')

    cy.myIntercept('GET', /tags$/, {
      statusCode: httpCodes.SUCCESS,
      body: tags.getAll.success.response
    }).as('get-tags4')

    cy.myIntercept('GET', 'devices?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: devices.getAll.forPaging.response
    }).as('get-devices8')

    cy.goToPage('Devices')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
    cy.wait('@get-devices7')

    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${deviceFixtures.totalCount}`)
    cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-first.mat-mdc-icon-button').click()
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${deviceFixtures.totalCount}`)
  })
})
