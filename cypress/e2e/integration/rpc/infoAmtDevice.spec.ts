/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

/* eslint-disable no-template-curly-in-string */
describe('AMT Info', () => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
    it('Should be in pre-provisioning mode', () => {
      const isWin = Cypress.platform === 'win32'
      let command = 'docker run --device=/dev/mei0 intel/oact-rpc-go:latest amtinfo'
      if (isWin) {
        command = 'rpc.exe amtinfo'
      }
      cy.exec(command, { failOnNonZeroExit: false }).then((result) => {
        cy.log(result.stdout)
        cy.log(result.stderr)
        expect(result.stderr).to.contain('pre-provisioning state')
      })
    })
  }
})
