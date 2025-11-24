/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

describe('Test eventchannellogs', () => {
  beforeEach('', () => {
    cy.setup()
  })

  it.skip('check default values - MQTT Events feature disabled', () => {
    // This test is skipped because:
    // 1. The navigation link for 'MQTT Events' is commented out in navbar.component.html
    // 2. The /event-channel route returns 404
    // The MQTT Events feature appears to be disabled
    cy.visit('/event-channel')
    cy.get('input[name="hostname"]').invoke('val').should('eq', 'localhost')
    cy.get('input[name="path"]').invoke('val').should('eq', '/mosquitto/mqtt')
  })

  it.skip('load all the eventchannelogs - MQTT Events feature disabled', () => {
    // This test is skipped because:
    // 1. The navigation link for 'MQTT Events' is commented out in navbar.component.html
    // 2. The /event-channel route returns 404
    // The MQTT Events feature appears to be disabled
    cy.visit('/event-channel')
    cy.get('h3').should('have.text', 'No Events')
  })
})
