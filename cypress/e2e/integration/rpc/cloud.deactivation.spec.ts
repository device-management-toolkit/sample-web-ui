/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  AMTInfo,
  buildDeactivateCommand,
  buildInfoCommand,
  buildOutput,
  execConfig,
  execWithRetry,
  getAmtInfo,
  getAmtVersion,
  notActivatedControlModes
} from './rpc.helpers'

if (Cypress.env('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  let amtInfo: AMTInfo
  const password: string = Cypress.env('AMT_PASSWORD')
  const fqdn: string = Cypress.env('ACTIVATION_URL')
  const rpcDockerImage: string = Cypress.env('RPC_DOCKER_IMAGE')
  const isWin = Cypress.platform === 'win32'
  const infoCommand = buildInfoCommand({ isWin, rpcDockerImage })
  let deactivateCommand = ''

  before(() => {
    getAmtInfo(infoCommand).then((info) => {
      deactivateCommand = buildDeactivateCommand({
        isWin,
        rpcDockerImage,
        password,
        amtVersion: getAmtVersion(info),
        fqdn
      })
    })
  })

  describe('Device Deactivation - Cloud', () => {
    context('TC_ACTIVATION_DEVICE_DEACTIVATE', () => {
      beforeEach(() => {
        cy.setup()
        getAmtInfo(infoCommand).then((info) => {
          amtInfo = info
          expect(info.controlMode, 'Device must be activated before deactivation').not.to.be.oneOf(notActivatedControlModes)
        })
      })

      it('should NOT deactivate device with an invalid password', () => {
        const invalidCommand =
          deactivateCommand.slice(0, deactivateCommand.indexOf('--password')) + '--password invalidpassword'
        execWithRetry(invalidCommand, execConfig).then((result) => {
          const { combined } = buildOutput(result)
          cy.log(combined)
          expect(combined).to.contain('Unable to authenticate with AMT')
        })
      })

      it('should deactivate device and verify the final control mode', () => {
        expect(amtInfo.controlMode).not.to.be.oneOf(notActivatedControlModes)
        execWithRetry(deactivateCommand, execConfig).then((result) => {
          const { combined } = buildOutput(result)
          cy.log(combined)
          expect(combined).to.contain('Status: Deactivated')
          cy.wait(15000)
          getAmtInfo(infoCommand).its('controlMode').should('be.oneOf', notActivatedControlModes)
        })
      })
    })
  })
}