/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import Constants from '../../../../src/app/shared/config/Constants'

const amtModes = ['ccmactivate', 'acmactivate']
const dhcpEnabled = [true, false]

const tlsModes: any = {
  'CIRA (Cloud)': { profileValue: 'CIRA' },
  'Server Authentication Only': { profileValue: 'server', value: 1 },
  'Server & Non-TLS Authentication': { profileValue: 'server-nontls', value: 2 },
  'Mutual TLS Authentication Only': { profileValue: 'mutualtls', value: 3 },
  'Mutual and Non-TLS Authentication': { profileValue: 'mutual-nontls', value: 4 }
}
const connectionMode = ['CIRA (Cloud)', 'Server Authentication Only', 'Server & Non-TLS Authentication', 'Mutual TLS Authentication Only', 'Mutual and Non-TLS Authentication']
const ciraProfile = 'happyPath'
const amtProfiles: any[] = []
const wifiConfigs = [
  [{}], // support non wifi config
  [{
    profileName: 'happyPath'
  }]
]
amtModes.forEach((amtMode) => {
  dhcpEnabled.forEach((dhcp) => {
    connectionMode.forEach((conMode) => {
      wifiConfigs.forEach((wifi) => {
        const dhcpS = dhcp ? 'DHCP' : 'Static'

        const profile: any = {
          profileName: `${amtMode}-${dhcpS}-${tlsModes[conMode].profileValue as string}`,
          activation: amtMode,
          amtPassword: '', // Cypress.env('AMT_PASSWORD'),
          mebxPassword: '', // Cypress.env('MEBX_PASSWORD'),
          dhcpEnabled: dhcp,
          userConsent: Constants.UserConsent_All,
          iderEnabled: true,
          kvmEnabled: true,
          solEnabled: true
        }
        if (conMode === 'CIRA (Cloud)') {
          profile.connectionMode = conMode
          profile.ciraConfigName = ciraProfile
        } else {
          profile.connectionMode = 'TLS (Enterprise)'
          profile.tlsConfig = conMode
          profile.tlsMode = tlsModes[conMode].value
        }
        if ((wifi[0] as any).profileName) {
          if (!dhcp) { return }
          (profile.profileName as string) += '-WiFi'
          profile.wifiConfigs = wifi
        }
        amtProfiles.push(profile)
      })
    })
  })
})

const profileFixtures = {
  happyPath: {
    profileName: 'happyPath',
    activation: 'ccmactivate',

    mebxPassword: 'P@ssw0rd',
    connectionMode: 'CIRA (Cloud)',
    dhcpEnabled: true,
    ciraConfig: 'happyPath',
    userConsent: Constants.UserConsent_All,
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true,
    wifiConfigs: [
      {
        priority: 1,
        profileName: 'happyPath'
      }
    ]
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
    solEnabled: true,
    wifiConfigs: [
      {
        profileName: 'happyPath',
        priority: 1
      }
    ]
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
    solEnabled: true,
    wifiConfigs: [
      {
        profileName: 'happyPath',
        priority: 1
      }
    ]
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
export { profileFixtures, amtProfiles }
