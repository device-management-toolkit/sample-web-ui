/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const wirelessConfigs = {
  getAll: {
    success: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            authenticationMethod: 6,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ],
            pskValue: 'pskValue'
          }
        ],
        totalCount: 1
      }
    },
    forProfile: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            authenticationMethod: 4,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ]
          }
        ]
      }
    },
    forPaging: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            authenticationMethod: 4,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ],
            pskValue: 'pskValue'
          },
          {
            profileName: 'happyPath',
            authenticationMethod: 4,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ],
            pskValue: 'pskValue'
          },
          {
            profileName: 'happyPath',
            authenticationMethod: 4,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ],
            pskValue: 'pskValue'
          },
          {
            profileName: 'happyPath',
            authenticationMethod: 4,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ],
            pskValue: 'pskValue'
          },
          {
            profileName: 'happyPath',
            authenticationMethod: 4,
            encryptionMethod: 4,
            ssid: 'test',
            pskPassphrase: 'Intel@123',
            linkPolicy: [
              14,
              16
            ],
            pskValue: 'pskValue'
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
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'test',
        pskPassphrase: 'Intel@123',
        linkPolicy: [
          14,
          16
        ]
      }
    }
  },
  update: {
    success: {
      response: {
        profileName: 'happyPath',
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'test',
        pskPassphrase: 'Intel@123',
        linkPolicy: [
          14,
          16
        ]
      }
    }
  },
  get: {
    success: {
      response: {
        profileName: 'happyPath',
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'test',
        pskPassphrase: 'Intel@123',
        linkPolicy: [
          14,
          16
        ]
      }
    }
  }
}

export { wirelessConfigs }
