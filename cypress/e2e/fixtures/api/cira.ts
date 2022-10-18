/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const ciraConfig = {
  getAll: {
    success: {
      response: {
        data: [
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 4433,
            username: 'standalone',
            password: 'G@ppm0ym',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          }
        ],
        totalCount: 1
      }
    },
    forProfile: {
      response: {
        data: [
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 1000,
            username: 'admin',
            password: 'Intel123!',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          }
        ],
        totalCount: 1
      }
    },
    forPaging: {
      response: {
        data: [
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 1000,
            username: 'admin',
            password: 'Intel123!',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          },
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 1000,
            username: 'admin',
            password: 'Intel123!',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          },
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 1000,
            username: 'admin',
            password: 'Intel123!',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          },
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 1000,
            username: 'admin',
            password: 'Intel123!',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          },
          {
            configName: 'happyPath',
            mpsServerAddress: '192.168.8.50',
            mpsPort: 1000,
            username: 'admin',
            password: 'Intel123!',
            commonName: '192.168.8.50',
            serverAddressFormat: 3,
            authMethod: 2,
            mpsRootCertificate: 'rootcert',
            proxyDetails: ''
          }
        ],
        totalCount: 100
      }
    }
  },
  create: {
    success: {
      response: {
        configName: 'happyPath',
        mpsServerAddress: '192.168.8.50',
        mpsPort: 4433,
        username: 'admin',
        password: 'Intel123!',
        commonName: '192.168.8.50',
        serverAddressFormat: 3,
        authMethod: 2,
        mpsRootCertificate: 'rootcert',
        proxyDetails: ''
      }
    }
  },
  update: {
    success: {
      response: {
        configName: 'ciraconfig2',
        mpsServerAddress: '192.168.8.50',
        mpsPort: 1000,
        username: 'admin',
        password: 'Intel123!',
        commonName: '192.168.8.50',
        serverAddressFormat: 3,
        authMethod: 2,
        mpsRootCertificate: 'rootcert',
        proxyDetails: ''
      }
    }
  },
  get: {
    success: {
      response: {
        configName: 'ciraconfig2',
        mpsServerAddress: '192.168.8.50',
        mpsPort: 1000,
        username: 'admin',
        password: 'Intel123!',
        commonName: '192.168.8.50',
        serverAddressFormat: 3,
        authMethod: 2,
        mpsRootCertificate: 'rootcert',
        proxyDetails: ''
      }
    }
  },
  inUse: {
    error: {
      response: {
        error: 'Foreign key violation',
        message: 'CIRA Config: happyPath associated with an AMT profile'
      }
    }
  }
}

export { ciraConfig }
