/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { AuthenticationProtocols, Config } from '../../../../src/app/ieee8021x/ieee8021x.constants'
import { httpCodes } from '../../fixtures/api/httpCodes'
import { wiredConfigs, wirelessConfigs } from '../../fixtures/formEntry/ieee8021x'
import * as api8021x from '../../fixtures/api/ieee8021x'
import { noConfigsResponse } from '../../fixtures/api/ieee8021x'

beforeEach('clear cache and login', () => {
  cy.setup()
  api8021x.interceptGetAll(httpCodes.SUCCESS, noConfigsResponse)
  cy.goToPage('IEEE 802.1x')
  cy.get('button').contains('Add New').click()
})

describe('test ieee8021x wired config creation', () => {
  const createdConfigs: Config[] = []
  wiredConfigs.forEach((config) => {
    it(`should create config ${config.profileName}`, () => {
      createdConfigs.push(config)
      api8021x.interceptPost(httpCodes.CREATED, config).as('interceptPost')
      const expectedRsp = { data: createdConfigs, totalCount: createdConfigs.length }
      api8021x.interceptGetAll(httpCodes.SUCCESS, expectedRsp).as('getAll')
      cy.enterIEEE8021xInfo(config)
      cy.get('button[type=submit]').click()
      cy.wait('@interceptPost').then((rsp) => {
        cy.wrap(rsp)
          .its('response.statusCode')
          .should('eq', httpCodes.CREATED)
      })
      cy.wait('@getAll')
      // Check that the ieee8021x config was successful
      cy.get('mat-cell').contains(config.profileName)
      cy.get('mat-cell').contains(AuthenticationProtocols.labelForValue(config.authenticationProtocol))
    })
  })
})

describe('test ieee8021x wireless config creation', () => {
  const createdConfigs: Config[] = []
  wirelessConfigs.forEach((config) => {
    it(`should create config ${config.profileName}`, () => {
      createdConfigs.push(config)
      api8021x.interceptPost(httpCodes.CREATED, config).as('interceptPost')
      const expectedRsp = { data: createdConfigs, totalCount: createdConfigs.length }
      api8021x.interceptGetAll(httpCodes.SUCCESS, expectedRsp).as('getAll')
      cy.enterIEEE8021xInfo(config)
      cy.get('button[type=submit]').click()
      cy.wait('@interceptPost').then((rsp) => {
        cy.wrap(rsp)
          .its('response.statusCode')
          .should('eq', httpCodes.CREATED)
      })
      cy.wait('@getAll')
      // Check that the ieee8021x config was successful
      cy.get('mat-cell').contains(config.profileName)
      cy.get('mat-cell').contains(AuthenticationProtocols.labelForValue(config.authenticationProtocol))
    })
  })
})
