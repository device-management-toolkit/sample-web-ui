/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

/* eslint-disable no-template-curly-in-string */
describe('Deactivate', () => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
    const isWin = Cypress.platform === 'win32'
    const password: string = Cypress.env('AMT_PASSWORD')
    const fqdn: string = Cypress.env('ACTIVATION_URL')
    let command = `docker run --device=/dev/mei0 vprodemo.azurecr.io/rpc-go:latest deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
    if (isWin) {
      command = `rpc.exe deactivate -u wss://${fqdn}/activate -v -n -f -json --password ${password}`
    }
    it('Should deactivate AMT device', {
      execTimeout: 90000,
      retries: {
        runMode: 3
      }
    }, () => {
      cy.exec(command, { failOnNonZeroExit: false }).then((result) => {
        expect(result.stderr).to.contain('Status: Deactivated')
      })
    })
  }
})
