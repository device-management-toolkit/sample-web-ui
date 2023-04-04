/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { allConfigs } from '../formEntry/ieee8021x'

export const allConfigsResponse = {
  data: allConfigs,
  totalCount: allConfigs.length
}

export const noConfigsResponse = {
  data: allConfigs,
  totalCount: allConfigs.length
}

export const pagingResponse = {
  data: allConfigs,
  totalCount: 100
}

export function interceptGetAll (statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept(
    'GET',
    'ieee8021xconfigs?*$count=true',
    { statusCode, body }
  )
}

export function interceptCountByInterface (statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept(
    'GET',
    'countByInterface',
    { statusCode, body }
  )
}

export function interceptPost (statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept(
    'POST',
    'ieee8021xconfigs',
    { statusCode, body }
  )
}

export function interceptDelete (statusCode: number, body: any): Cypress.Chainable<Element> {
  return cy.myIntercept(
    'DELETE',
    /.*ieee8021x.*/,
    { statusCode, body }
  )
}
