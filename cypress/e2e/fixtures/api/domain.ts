/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const domains = {
  getAll: {
    success: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd'
          }
        ],
        totalCount: 1
      }
    },
    forPaging: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd'
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd'
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd'
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd'
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd'
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
        domainSuffix: 'happyPath.com',
        provisioningCert: 'test',
        provisioningCertStorageFormat: 'raw',
        provisioningCertPassword: 'P@ssw0rd'
      }
    }
  },
  update: {
    success: {
      response: {
        profileName: 'NewDomain',
        domainSuffix: 'NewDomain.com',
        provisioningCert: 'test',
        provisioningCertStorageFormat: 'raw',
        provisioningCertPassword: 'P@ssw0rd'
      }
    }
  },
  get: {
    success: {
      response: {
        profileName: 'NewDomain',
        domainSuffix: 'NewDomain.com',
        provisioningCert: 'test',
        provisioningCertStorageFormat: 'raw',
        provisioningCertPassword: 'P@ssw0rd'
      }
    }
  },
  delete: {
    success: {
      response: {}
    }
  }
}

export { domains }
