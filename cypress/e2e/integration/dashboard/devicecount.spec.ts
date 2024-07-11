/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from 'cypress/e2e/fixtures/api/httpCodes'

describe('Dashboard Test', () => {
  beforeEach(() => {
    cy.setup()
  })

  it('shows stats on dashboard', () => {
    cy.wait('@stats-request').then((response) => {
      if (response.response) {
        expect(response.response.statusCode).to.eq(httpCodes.SUCCESS)
        const totalCount = response.response.body.totalCount
        const connectedCount = response.response.body.connectedCount
        cy.get('[data-cy="totalCount"]').should('have.text', totalCount)
        cy.get('[data-cy="connectedCount"]').should('have.text', connectedCount)
        cy.get('[data-cy="disconnectedCount"]').should('have.text', totalCount - connectedCount)
      }
    })
  })
})
