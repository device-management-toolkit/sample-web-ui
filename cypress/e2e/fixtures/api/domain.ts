/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Set dates for expiration test
const today = new Date()
const okayDate = new Date(today)
const warnDate = new Date(today)
const expDate = new Date(today)

okayDate.setMonth(today.getMonth() + 3)
warnDate.setMonth(today.getMonth() + 1)
expDate.setMonth(today.getMonth() - 2)

const domains = {
  getAll: {
    success: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            domainSuffix: Cypress.env('DOMAIN_SUFFIX'),
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
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
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
          },
          {
            profileName: 'happyPath',
            domainSuffix: 'happyPath.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
          }
        ],
        totalCount: 100
      }
    }
  },
  getThree: {
    success: {
      response: {
        data: [
          {
            profileName: 'happyPath',
            domainSuffix: Cypress.env('DOMAIN_SUFFIX'),
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: okayDate
          },
          {
            profileName: 'happyPath2',
            domainSuffix: 'happyPath2.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: warnDate
          },
          {
            profileName: 'happyPath3',
            domainSuffix: 'happyPath3.com',
            provisioningCert: 'test',
            provisioningCertStorageFormat: 'raw',
            provisioningCertPassword: 'P@ssw0rd',
            expirationDate: expDate
          }
        ],
        totalCount: 3
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
        provisioningCertPassword: 'P@ssw0rd',
        expirationDate: okayDate
      }
    },
    failure: {
      response: {
        error: 'Unique key violation',
        message: 'domainDetail.uniqueKeyViolation.value'
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
        provisioningCertPassword: 'P@ssw0rd',
        expirationDate: okayDate
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
        provisioningCertPassword: 'P@ssw0rd',
        expirationDate: okayDate
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
