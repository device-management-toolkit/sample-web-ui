/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const networkConfigs = {
  getAll: {
    success: {
      response: [
        {
          profileName: 'happyPath',
          dhcpEnabled: true
        }
      ]
    }
  },
  create: {
    success: {
      response: {
        profileName: 'profile6',
        dhcpEnabled: true
      }
    }
  },
  update: {
    success: {
      response: {
        profileName: 'profile6',
        dhcpEnabled: true
      }
    }
  },
  get: {
    success: {
      response: {
        profileName: 'profile6',
        dhcpEnabled: true
      }
    }
  }
}

export { networkConfigs }
