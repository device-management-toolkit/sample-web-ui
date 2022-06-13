/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const wirelessFixtures = {
  happyPath: {
    profileName: 'happyPath',
    authenticationMethod: 'WPA PSK',
    encryptionMethod: 'CCMP',
    ssid: 'test',
    linkPolicy: [14, 16],
    pskValue: 'pskValue'
  },
  wrong: {
    profileName: 'wireless config'
  },
  totalCount: 100
}

export { wirelessFixtures }
