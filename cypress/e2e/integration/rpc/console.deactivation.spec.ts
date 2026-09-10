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
  getAmtInfoWithRetry,
  getAmtVersion,
  notActivatedControlModes,
  getAuthEndpoint
} from './rpc.helpers'
import { secret } from '../../../support/secrets'

if (Cypress.expose('ISOLATE').charAt(0).toLowerCase() !== 'y') {
  let amtInfo: AMTInfo
  const profileName: string = Cypress.expose('PROFILE_NAME') as string
  const rpcDockerImage: string = Cypress.expose('RPC_DOCKER_IMAGE')
  const isAdminControlModeProfile = profileName.startsWith('acmactivate')
  const isWin = Cypress.platform === 'win32'
  const authEndpoint = getAuthEndpoint()
  const infoCommand = buildInfoCommand({ isWin, rpcDockerImage })
  let deactivateCommand = ''

  before(() => {
    getAmtInfo(infoCommand).then((info) => {
      deactivateCommand = buildDeactivateCommand({
        isWin,
        rpcDockerImage,
        // Read here: secrets load in a before() hook, after this file evaluates.
        password: secret('AMT_PASSWORD'),
        amtVersion: getAmtVersion(info),
        isAdminControlModeProfile,
        authEndpoint: authEndpoint,
        authUsername: Cypress.expose('MPS_USERNAME'),
        authPassword: secret('MPS_PASSWORD')
      })
    })
  })

  describe('Device Deactivation - Console', () => {
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

      it('should NOT deactivate an ACM device with an invalid password', function () {
        if (!isAdminControlModeProfile) {
          this.skip()
        }

        // Match both v2 (-password) and v3 (--password) syntax by capturing the dash(es) and preserving them
        const invalidCommand = deactivateCommand.replace(/(-{1,2})password\s+\S+/, '$1password invalidpassword')
        execWithRetry(invalidCommand, execConfig).then((result) => {
          const { combined } = buildOutput(result)
          cy.log(combined)
          expect(combined).to.contain('Error 109: UnableToDeactivate')
        })
      })

      it('should deactivate device and verify the final control mode', () => {
        expect(amtInfo.controlMode).not.to.be.oneOf(notActivatedControlModes)
        execWithRetry(deactivateCommand, execConfig).then((result) => {
          const { combined } = buildOutput(result)
          cy.log(combined)
          expect(combined).to.contain('Status: Device deactivated')
          getAmtInfoWithRetry(infoCommand).its('controlMode').should('be.oneOf', notActivatedControlModes)
        })
      })
    })
  })
}
