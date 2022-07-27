/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { amtProfiles } from '../formEntry/profile'

const profiles = {
  getAll: {
    success: {
      response: {
        data: amtProfiles,
        totalCount: amtProfiles.length
      }
    },
    forPaging: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            generateRandomPassword: false,
            passwordLength: null,
            configurationScript: null,
            activation: 'ccmactivate',
            ciraConfigName: 'default',
            dhcpEnabled: 'true',
            generateRandomMEBxPassword: false,
            mebxPasswordLength: null
          },
          {
            profileName: 'happyPath',
            generateRandomPassword: false,
            passwordLength: null,
            configurationScript: null,
            activation: 'ccmactivate',
            ciraConfigName: 'default',
            dhcpEnabled: 'true',
            generateRandomMEBxPassword: false,
            mebxPasswordLength: null
          },
          {
            profileName: 'happyPath',
            generateRandomPassword: false,
            passwordLength: null,
            configurationScript: null,
            activation: 'ccmactivate',
            ciraConfigName: 'default',
            dhcpEnabled: 'true',
            generateRandomMEBxPassword: false,
            mebxPasswordLength: null
          },
          {
            profileName: 'happyPath',
            generateRandomPassword: false,
            passwordLength: null,
            configurationScript: null,
            activation: 'ccmactivate',
            ciraConfigName: 'default',
            dhcpEnabled: 'true',
            generateRandomMEBxPassword: false,
            mebxPasswordLength: null
          },
          {
            profileName: 'happyPath',
            generateRandomPassword: false,
            passwordLength: null,
            configurationScript: null,
            activation: 'ccmactivate',
            ciraConfigName: 'default',
            dhcpEnabled: 'true',
            generateRandomMEBxPassword: false,
            mebxPasswordLength: null
          }
        ],
        totalCount: 100
      }
    }
  },
  create: {
    success: {
      response: {
        profileName: 'happyPath',
        configurationScript: null,
        activation: 'ccmactivate',
        ciraConfigName: 'default',
        dhcpEnabled: true
      }
    }
  },
  update: {
    success: {
      response: {
        profileName: 'profile6',
        amtPassword: 'Intel123!',
        mebxPassword: 'Intel123!',
        activation: 'activate'
      }
    }
  },
  get: {
    success: {
      response: {
        profileName: 'profile6',
        amtPassword: 'Intel123!',
        mebxPassword: 'Intel123!',
        activation: 'activate'
      }
    }
  }
}

export { profiles }
