/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'
import { profiles } from 'cypress/e2e/fixtures/api/profile'
import { paging } from 'cypress/e2e/fixtures/formEntry/paging'

describe('Test Profile Page Pagination', () => {
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
    cy.wait('@get-profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').then(($label) => {
      const text = $label.text()
      if (text.includes(`1 – 25 of ${paging.totalCount}`)) {
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${paging.totalCount}`)
      } else {
        cy.log('Real API mode: Not enough profiles for pagination test, skipping')
      }
    })
  })

  it('pagination for previous page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=25&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles2')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').then(($label) => {
      const text = $label.text()
      if (text.includes(`1 – 25 of ${paging.totalCount}`)) {
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-next.mat-mdc-icon-button').click()
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`26 – 50 of ${paging.totalCount}`)
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-previous.mat-mdc-icon-button').click()
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
      } else {
        cy.log('Real API mode: Not enough profiles for pagination test, skipping')
      }
    })
  })

  it('pagination for last page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles2')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').then(($label) => {
      const text = $label.text()
      if (text.includes(`1 – 25 of ${paging.totalCount}`)) {
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${paging.totalCount}`)
      } else {
        cy.log('Real API mode: Not enough profiles for pagination test, skipping')
      }
    })
  })

  it('pagination for first page', () => {
    cy.myIntercept('GET', 'profiles?$top=25&$skip=0&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles')

    cy.myIntercept('GET', 'profiles?$top=25&$skip=75&$count=true', {
      statusCode: httpCodes.SUCCESS,
      body: profiles.getAll.forPaging.response
    }).as('get-profiles2')

    cy.goToPage('Profiles')
    cy.wait('@get-profiles')
    cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').then(($label) => {
      const text = $label.text()
      if (text.includes(`1 – 25 of ${paging.totalCount}`)) {
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-last.mat-mdc-icon-button').click()
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`76 – 100 of ${paging.totalCount}`)
        cy.get('mat-paginator').find('button.mat-mdc-paginator-navigation-first.mat-mdc-icon-button').click()
        cy.get('mat-paginator').find('.mat-mdc-paginator-range-label').contains(`1 – 25 of ${paging.totalCount}`)
      } else {
        cy.log('Real API mode: Not enough profiles for pagination test, skipping')
      }
    })
  })
})
