/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ActivationModes, TlsModes, UserConsentModes } from '../../../../src/app/profiles/profiles.constants'
import { wirelessFixtures } from './wireless'
import { ciraConfig } from '../api/cira'

const dhcpEnabledValues = [true, false]

const wifiConfigs = [
  [{}], // support non wifi config
  [wirelessFixtures.happyPath]
]

const amtProfiles: any[] = []
ActivationModes.forEach((activationMode) => {
  dhcpEnabledValues.forEach((dhcpEnabled) => {
    ;['CIRA', 'TLS'].forEach((connection) => {
      wifiConfigs.forEach((wifi) => {
        const dhcpLabel = dhcpEnabled ? 'DHCP' : 'STATIC'
        const profile: any = {
          profileName: `${activationMode.value}-${dhcpLabel}-${connection}`,
          activation: activationMode.value,
          amtPassword: '', // Cypress.env('AMT_PASSWORD'),
          mebxPassword: '', // Cypress.env('MEBX_PASSWORD'),
          dhcpEnabled,
          userConsent: 'All',
          iderEnabled: true,
          kvmEnabled: true,
          solEnabled: true
        }
        if (connection === 'CIRA') {
          profile.ciraConfigName = ciraConfig.getAll.forProfile.response.data[0].configName
        } else {
          profile.tlsMode = 2 //SERVER_NON_TLS
        }
        if ((wifi[0] as any).profileName) {
          if (!dhcpEnabled) {
            return
          }
          ;(profile.profileName as string) += '-WiFi'
          profile.wifiConfigs = wifi
        }
        amtProfiles.push(profile)
      })
    })
  })
})

// create all of the TLS modes
// (and add STATIC with ipSyncEnabled of false)
TlsModes.forEach((tlsMode) => {
  const name = tlsMode.label.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
  amtProfiles.push({
    profileName: `STATIC-${name}`,
    activation: 'acmactivate',
    amtPassword: '', // Cypress.env('AMT_PASSWORD'),
    mebxPassword: '', // Cypress.env('MEBX_PASSWORD'),
    dhcpEnabled: false,
    ipSyncEnabled: false,
    localWifiSyncEnabled: false,
    userConsent: 'All',
    iderEnabled: true,
    kvmEnabled: true,
    solEnabled: true,
    tlsMode: tlsMode.value
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
    userConsent: 'All',
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
    connectionMode: 'TLS',
    tlsConfig: 'Server Authentication Only',
    generateRandomPassword: false,
    userConsent: 'All',
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
    userConsent: 'All',
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
    userConsent: 'All',
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
    userConsent: 'All',
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
