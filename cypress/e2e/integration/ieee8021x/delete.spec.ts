/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Config } from '../../../../src/app/ieee8021x/ieee8021x.constants'
import { httpCodes } from '../../fixtures/api/httpCodes'
import * as api8021x from '../../fixtures/api/ieee8021x'
import { wiredConfigs, wirelessConfigs } from '../../fixtures/formEntry/ieee8021x'

describe('Test IEEE 8021x Page', () => {
  beforeEach(() => {
    cy.setup()
    api8021x.interceptDelete(httpCodes.NO_CONTENT, null)
  })

  it('should not delete when cancelled', () => {
    api8021x
      .interceptGetAll(httpCodes.SUCCESS, { data: allConfigs, totalCount: allConfigs.length })
      .as('interceptGetAll')
    cy.goToPage('IEEE 802.1x')
    cy.wait('@interceptGetAll')
    cy.get('mat-cell').contains('delete').click()
    cy.get('button').contains('No').click()
  })

  const allConfigs = [...wiredConfigs, ...wirelessConfigs]
  const remainingConfigs = [...allConfigs]

  allConfigs.forEach((config) => {
    it(`should delete ${config.profileName}`, () => {
      const initialNavConfigs: Config[] = []
      for (const cfg of remainingConfigs) {
        initialNavConfigs.push(cfg)
      }
      let i = remainingConfigs.length
      while (i--) {
        if (remainingConfigs[i].profileName === config.profileName) {
          remainingConfigs.splice(i, 1)
          break
        }
      }
      api8021x
        .interceptGetAll(httpCodes.SUCCESS, { data: initialNavConfigs, totalCount: initialNavConfigs.length })
        .as('getAllNumber01')
      cy.goToPage('IEEE 802.1x')
      cy.wait('@getAllNumber01')
      api8021x
        .interceptGetAll(httpCodes.SUCCESS, { data: remainingConfigs, totalCount: remainingConfigs.length })
        .as('getAllNumber02')
      // Delete profile
      cy.get('mat-row').contains(config.profileName).parent().contains('delete').click()
      cy.get('button').contains('Yes').click()
      cy.wait('@getAllNumber02')
    })
  })
})
