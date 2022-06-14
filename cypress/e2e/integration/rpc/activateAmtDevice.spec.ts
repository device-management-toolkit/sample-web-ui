/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

/* eslint-disable no-template-curly-in-string */
describe('Activate', () => {
  if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
    const isWin = Cypress.platform === 'win32'
    const profileName: string = Cypress.env('PROFILE_NAME') as string
    const fqdn: string = Cypress.env('ACTIVATION_URL')
    let command = `docker run --device=/dev/mei0 intel/oact-rpc-go:latest activate -u wss://${fqdn}/activate -v -n --profile ${profileName}`
    if (isWin) {
      command = `rpc.exe activate -u wss://${fqdn}/activate -v -n --profile ${profileName}`
    }
    it('Should activate AMT device', { execTimeout: 240000 }, () => {
      cy.exec(command, { failOnNonZeroExit: false }).then((result) => {
        expect(result.stderr).to.contain('Status: Client control mode')
        expect(result.stderr).to.contain('Network: Ethernet Configured.')
        expect(result.stderr).to.contain('CIRA: Configured')
      })
    })
  }
})
