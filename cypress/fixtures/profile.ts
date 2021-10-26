/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
const profileFixtures = {
  happyPath: {
    name: 'happyPath',
    admin: false,
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    netConfig: 'DHCP',
    ciraConfig: 'happyPath'
  },

  wrong: {
    name: 'bad name !',
    amtPassword: 'password',
    mebxPassword: '12345678'
  },

  check: {
    network: {
      dhcp: true,
      static: false
    },

    mode: {
      acm: 'acmactivate',
      ccm: 'ccmactivate'
    }
  },

  totalCount: 100
}
export { profileFixtures }
