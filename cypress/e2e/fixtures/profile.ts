/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import Constants from '../../../src/app/shared/config/Constants'

const profileFixtures = {
  happyPath: {
    profileName: 'happyPath',
    activation: 'ccmactivate',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    connectionMode: 'CIRA (Cloud)',
    dhcpEnabled: true,
    ciraConfig: 'happyPath',
    userConsent: Constants.UserConsent_All,
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true
  },

  wrong: {
    name: 'bad name !',
    amtPassword: 'password',
    mebxPassword: '12345678'
  },

  check: {
    network: {
      dhcp: 'DHCP',
      static: 'Static'
    },

    mode: {
      acm: 'acmactivate',
      ccm: 'ccmactivate'
    }
  },

  totalCount: 100,
  happyPathTls: {
    profileName: 'happyTlspath',
    activation: 'ccmactivate',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    dhcpEnabled: true,
    connectionMode: 'TLS (Enterprise)',
    tlsConfig: 'Server Authentication Only',
    generateRandomPassword: false,
    userConsent: Constants.UserConsent_All,
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true
  },

  happyPathStaticCIRA: {
    profileName: 'happyPathStaticCIRA',
    activation: 'ccmactivate',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    connectionMode: 'CIRA (Cloud)',
    dhcpEnabled: false,
    ciraConfig: 'happyPath',
    userConsent: Constants.UserConsent_All,
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true
  },

  happyPathStaticCIRARandomPassword: {
    profileName: 'happyPathStaticCIRARandomPassword',
    activation: 'ccmactivate',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    connectionMode: 'CIRA (Cloud)',
    dhcpEnabled: false,
    ciraConfig: 'happyPath',
    userConsent: Constants.UserConsent_All,
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true
  },
  patchWirelessConfigHappyPath: {
    profileName: 'happyTlspath',
    activation: 'acmactivate',
    ciraConfigName: null,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    tags: [],
    dhcpEnabled: true,
    tlsMode: 1,
    tenantId: '',
    wifiConfigs: [
      {
        profileName: 'happyPath',
        priority: 1
      }
    ],
    userConsent: Constants.UserConsent_All,
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true
  },
  patchServerAuthentication: {
    profileName: 'happyTlspath',
    activation: 'acmactivate',
    ciraConfigName: null,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    tags: [],
    dhcpEnabled: true,
    tlsMode: 1,
    tenantId: '',
    wifiConfigs: []
  },
  patchServerNonTLS: {
    profileName: 'happyTlspath',
    activation: 'acmactivate',
    ciraConfigName: null,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    tags: [],
    dhcpEnabled: true,
    tlsMode: 2,
    tenantId: '',
    wifiConfigs: []
  },
  patchMutualTLS: {
    profileName: 'happyTlspath',
    activation: 'acmactivate',
    ciraConfigName: null,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    tags: [],
    dhcpEnabled: true,
    tlsMode: 3,
    tenantId: '',
    wifiConfigs: []
  },
  patchMutualNonTLS: {
    profileName: 'happyTlspath',
    activation: 'acmactivate',
    ciraConfigName: null,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    tags: [],
    dhcpEnabled: true,
    tlsMode: 4,
    tenantId: '',
    wifiConfigs: []
  },
  patchSTATIC: {
    profileName: 'happyTlspath',
    activation: 'ccmactivate',
    ciraConfigName: null,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    tags: [],
    dhcpEnabled: false,
    tlsMode: 1,
    tenantId: '',
    wifiConfigs: []
  }
}
export { profileFixtures }
