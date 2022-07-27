/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const wirelessFixtures = {
  happyPath: {
    profileName: 'happyPath',
    authenticationMethod: 'WPA2 PSK',
    encryptionMethod: 'CCMP',
    linkPolicy: [14, 16]
  },
  wrong: {
    profileName: 'wireless config'
  }
}

export { wirelessFixtures }
