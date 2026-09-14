/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Fetch credentials on demand and keep authenticated requests out of the command log.
export const basicAuthRequest = <T = any>(
  options: Partial<Cypress.RequestOptions>,
  username: string,
  passwordKey: string
): Cypress.Chainable<Cypress.Response<T>> =>
  cy.env([passwordKey]).then((values) => {
    const password = values[passwordKey] == null ? '' : String(values[passwordKey])
    if (password.length === 0) {
      throw new Error(`${passwordKey} must be configured for authenticated requests`)
    }
    return cy.request<T>({
      ...options,
      headers: { ...options.headers, Authorization: `Basic ${btoa(`${username}:${password}`)}` },
      log: false
    })
  })
