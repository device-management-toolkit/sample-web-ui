/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
describe('Test eventchannellogs', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it('check default values', () => {
    cy.goToPage('Event Logs')
    cy.get('input[name="hostname"]').invoke('val').should('eq', 'localhost')
    cy.get('input[name="port"]').invoke('val').should('eq', '9001')
    cy.get('input[name="path"]').invoke('val').should('eq', '/mqtt')
  })

  it('load all the eventchannelogs', () => {
    cy.goToPage('Event Logs')
    cy.get('h3').should('have.text', 'No Events')
  })
})
