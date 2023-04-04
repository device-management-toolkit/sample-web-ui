/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { AuthenticationProtocols, Config } from '../../../../src/app/ieee8021x/ieee8021x.constants'
import { httpCodes } from '../../fixtures/api/httpCodes'
import { allConfigs } from '../../fixtures/formEntry/ieee8021x'
import * as api8021x from '../../fixtures/api/ieee8021x'
import { noConfigsResponse } from '../../fixtures/api/ieee8021x'

beforeEach('clear cache and login', () => {
  cy.setup()
  api8021x.interceptGetAll(httpCodes.SUCCESS, noConfigsResponse)
  api8021x.interceptCountByInterface(httpCodes.SUCCESS, { wired: 0, wireless: 0 })
  cy.goToPage('IEEE 802.1x')
  cy.get('button').contains('Add New').click()
})

describe('test ieee8021x wired config creation', () => {
  const createdConfigs: Config[] = []
  allConfigs.forEach((config) => {
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

describe('test error inputs', () => {
  let config: Config
  beforeEach('clear cache and login', () => {
    config = JSON.parse(JSON.stringify(allConfigs[0]))
  })

  it('should raise error for long profileName', () => {
    config.profileName = 'ABCDEF0123456789' +
      'ABCDEF0123456789' +
      'ABCDEF0123456789' +
      'ABCDEF0123456789' +
      'ABCDEF0123456789'
    cy.enterIEEE8021xInfo(config)
    cy.matFormFieldAssertInvalid('profileName', true)
    cy.get('button[type=submit]').should('be.disabled')
  })

  it('should raise error for incorrect pxeTimeout value', () => {
    config.pxeTimeout = 999999999
    cy.enterIEEE8021xInfo(config)
    cy.matFormFieldAssertInvalid('pxeTimeout', true)
    cy.get('button[type=submit]').should('be.disabled')
  })
})
