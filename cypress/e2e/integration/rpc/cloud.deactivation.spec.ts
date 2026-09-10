/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  AMTInfo,
  buildCloudDeactivateCommandCandidates,
  buildInfoCommand,
  buildOutput,
  execConfig,
  execWithCompatibilityFallback,
  getAmtInfo,
  getAmtInfoWithRetry,
  getAmtVersion,
  notActivatedControlModes
} from './rpc.helpers'
import { secret } from '../../../support/secrets'

if (Cypress.expose('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  let amtInfo: AMTInfo
  const fqdn: string = Cypress.expose('ACTIVATION_URL')
  const rpcDockerImage: string = Cypress.expose('RPC_DOCKER_IMAGE')
  const isWin = Cypress.platform === 'win32'
  const infoCommand = buildInfoCommand({ isWin, rpcDockerImage })
  let deactivateCommands: string[] = []

  before(() => {
    getAmtInfo(infoCommand).then((info) => {
      deactivateCommands = buildCloudDeactivateCommandCandidates({
        isWin,
        rpcDockerImage,
        // Read here: secrets load in a before() hook, after this file evaluates.
        password: secret('AMT_PASSWORD'),
        amtVersion: getAmtVersion(info),
        fqdn
      })
    })
  })

  describe('Device Deactivation - Cloud', () => {
    context('TC_DEACTIVATION_DEVICE_DEACTIVATE', () => {
      beforeEach(() => {
        cy.setup()
        getAmtInfo(infoCommand).then((info) => {
          amtInfo = info
          expect(info.controlMode, 'Device must be activated before deactivation').not.to.be.oneOf(
            notActivatedControlModes
          )
        })
      })

      it('should deactivate device and verify the final control mode', () => {
        expect(amtInfo.controlMode).not.to.be.oneOf(notActivatedControlModes)
        execWithCompatibilityFallback(deactivateCommands, execConfig).then((result) => {
          const { combined } = buildOutput(result)
          cy.log(combined)
          expect(combined).to.contain('Status: Deactivated')
          // Deactivation is asynchronous, so poll AMT instead of relying on a fixed delay.
          getAmtInfoWithRetry(infoCommand, execConfig, 6, 5000)
            .its('controlMode')
            .should('be.oneOf', notActivatedControlModes)
        })
      })
    })
  })
}
