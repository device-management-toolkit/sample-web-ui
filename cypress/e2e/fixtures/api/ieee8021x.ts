/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { wiredConfigs, wirelessConfigs } from '../formEntry/ieee8021x'

export const wiredConfigsResponse = {
  data: wiredConfigs,
  totalCount: wiredConfigs.length
}

export const wirelessConfigsResponse = {
  data: wirelessConfigs,
  totalCount: wirelessConfigs.length
}

export const noConfigsResponse = {
  data: [],
  totalCount: 0
}

export function interceptGetAll(statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept('GET', 'ieee8021xconfigs?*$count=true', { statusCode, body })
}

export function interceptPost(statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept('POST', 'ieee8021xconfigs', { statusCode, body })
}

export function interceptDelete(statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept('DELETE', /.*ieee8021x.*/, { statusCode, body })
}
