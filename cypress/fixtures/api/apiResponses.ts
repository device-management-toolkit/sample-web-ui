import { profileFixtures } from '../profile'

/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const httpCodes = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
}
const apiResponses = {
  login: {
    fail: {
      response: {
        error: 'string',
        message: 'string'
      }
    }
  },
  domains: {
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
      empty: {
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        response: {}
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    }
  },
  ciraConfigs: {
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
      empty: {
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        response: {}
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    }
  },
  profiles: {
    getAll: {
      success: {
        response: {
          data: [
            profileFixtures.happyPath,
            profileFixtures.happyPathTls
          ],
          totalCount: 2
        }
      },
      empty: {
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        response: {}
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    }
  },
  devices: {
    getAll: {
      success: {
        response: {
          data: [
            {
              name: 'Win7-machine',
              mpsuser: 'standalone',
              amtuser: 'admin',
              host: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
              icon: 1,
              conn: 1,
              metadata: {
                guid: 12345,
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'pick',
                  'me'
                ]
              }
            },
            {
              name: 'Ubuntu-machine',
              mpsuser: 'xenial',
              amtuser: 'admin',
              host: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
              icon: 1,
              conn: 0,
              metadata: {
                guid: 67890,
                hostname: 'AMTDEVICENUC2',
                tags: [
                  'not',
                  'me'
                ]
              }
            }
          ],
          totalCount: 2
        }
      },
      empty: {
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      tags: {
        response: {
          data: [
            {
              name: 'Win7-machine1',
              mpsuser: 'standalone',
              amtuser: 'admin',
              host: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
              icon: 1,
              conn: 1,
              metadata: {
                guid: '123e4567-e89b-12d3-a456-426614174000',
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'Windows',
                  'NUC',
                  'Store #123'
                ]
              }
            },
            {
              name: 'Ubuntu-machine1',
              mpsuser: 'xenial',
              amtuser: 'admin',
              host: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
              icon: 1,
              conn: 0,
              metadata: {
                guid: '123e4567-e89b-12d3-a456-426614174001',
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'Linux',
                  'NUC',
                  'Store #123'
                ]
              }
            },
            {
              name: 'Win7-machine2',
              mpsuser: 'standalone',
              amtuser: 'admin',
              host: '8dad96cb-c3db-11e6-9c43-bc0000d20001',
              icon: 1,
              conn: 1,
              metadata: {
                guid: '123e4567-e89b-12d3-a456-426614174002',
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'Windows',
                  'DELL',
                  'Store #123'
                ]
              }
            },
            {
              name: 'Ubuntu-machine2',
              mpsuser: 'xenial',
              amtuser: 'admin',
              host: 'bf49cf00-9164-11e4-952b-b8aeed7ec595',
              icon: 1,
              conn: 0,
              metadata: {
                guid: '123e4567-e89b-12d3-a456-426614174003',
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'Linux',
                  'DELL',
                  'Store #456'
                ]
              }
            }
          ],
          totalCount: 4
        }
      },
      windows: {
        response: {
          data: [
            {
              name: 'Win7-machine1',
              mpsuser: 'standalone',
              amtuser: 'admin',
              host: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
              icon: 1,
              conn: 1,
              metadata: {
                guid: '123e4567-e89b-12d3-a456-426614174000',
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'Windows',
                  'NUC',
                  'Store #123'
                ]
              }
            },
            {
              name: 'Win7-machine2',
              mpsuser: 'standalone',
              amtuser: 'admin',
              host: '8dad96cb-c3db-11e6-9c43-bc0000d20001',
              icon: 1,
              conn: 1,
              metadata: {
                guid: '123e4567-e89b-12d3-a456-426614174002',
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'Windows',
                  'DELL',
                  'Store #123'
                ]
              }
            }
          ],
          totalCount: 2
        }
      },
      forPaging: {
        response: {
          data: [
            {
              name: 'Win7-machine',
              mpsuser: 'standalone',
              amtuser: 'admin',
              hostname: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
              icon: 1,
              conn: 1,
              metadata: {
                guid: 12345,
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'pick',
                  'me'
                ]
              }
            },
            {
              name: 'Ubuntu-machine',
              mpsuser: 'xenial',
              amtuser: 'admin',
              hostname: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
              icon: 1,
              conn: 0,
              metadata: {
                guid: 67890,
                hostname: 'AMTDEVICENUC2',
                tags: [
                  'not',
                  'me'
                ]
              }
            },
            {
              name: 'Win7-machine',
              mpsuser: 'standalone',
              amtuser: 'admin',
              hostname: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
              icon: 1,
              conn: 1,
              metadata: {
                guid: 12345,
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'pick',
                  'me'
                ]
              }
            },
            {
              name: 'Ubuntu-machine',
              mpsuser: 'xenial',
              amtuser: 'admin',
              hostname: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
              icon: 1,
              conn: 0,
              metadata: {
                guid: 67890,
                hostname: 'AMTDEVICENUC2',
                tags: [
                  'not',
                  'me'
                ]
              }
            },
            {
              name: 'Win7-machine',
              mpsuser: 'standalone',
              amtuser: 'admin',
              hostname: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
              icon: 1,
              conn: 1,
              metadata: {
                guid: 12345,
                hostname: 'AMTDEVICENUC1',
                tags: [
                  'pick',
                  'me'
                ]
              }
            }
          ],
          totalCount: 100
        }
      }
    }
  },
  tags: {
    getAll: {
      success: {
        response: [
          'Windows',
          'Linux',
          'NUC',
          'Dell',
          'Store #123',
          'Store #456'
        ]
      }
    }
  },
  networkConfigs: {
    getAll: {
      success: {
        response: [
          {
            profileName: 'happyPath',
            dhcpEnabled: true
          }
        ]
      },
      empty: {
        response: []
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    create: {
      success: {
        response: {
          profileName: 'profile6',
          dhcpEnabled: true
        }
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    update: {
      success: {
        response: {
          profileName: 'profile6',
          dhcpEnabled: true
        }
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    get: {
      success: {
        response: {
          profileName: 'profile6',
          dhcpEnabled: true
        }
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        response: {}
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    }
  },
  wirelessConfigs: {
    getAll: {
      success: {
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
            }
          ],
          totalCount: 1
        }
      },
      empty: {
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      forProfile: {
        response: [
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      badRequest: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
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
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        response: {}
      },
      notFound: {
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        response: {
          error: 'string',
          message: 'string'
        }
      }
    }
  },
  eventLogs: {
    getAll: {
      success: {
        response: [
          {
            DeviceAddress: 255,
            EventSensorType: 15,
            EventType: 111,
            EventOffset: 2,
            EventSourceType: 104,
            EventSeverity: 8,
            SensorNumber: 255,
            Entity: 34,
            EntityInstance: 0,
            EventData: [
              64,
              19,
              0,
              0,
              0,
              0,
              0,
              0
            ],
            Time: '2021-09-08T16:31:02.000Z',
            EntityStr: 'BIOS',
            Desc: 'Starting operating system boot process'
          }
        ]
      }
    },
    devices: {
      success: {
        response: {
          data: [
            {
              connectionStatus: false,
              guid: 'guid',
              hostname: 'DESKTOP-JF2I0UQ',
              mpsInstance: null,
              mpsusername: 'admin',
              tags: [],
              tenantId: ''
            }
          ],
          totalCount: 1
        }
      }
    },
    version: {
      success: {
        response: {
          CIM_SoftwareIdentity: {
            responses: [
              {},
              {},
              {},
              {
                VersionString: '16.0.8'
              }
            ]
          }
        }
      }
    },
    hardwareInfo: {
      success: {
        response: {
          CIM_Chassis: {
            response: {
              Manufacturer: 'Intel',
              Model: 'AMT',
              SerialNumber: '12',
              Version: '16'
            }
          }
        }
      }
    },
    auditlog: {
      success: {
        response: {
          records: [
            {
              Event: 'KVM enabled',
              Time: '2021-09-08T16:31:02.000Z'
            }
          ],
          totalCnt: 1
        }
      }
    },
    amtFeatures: {
      success: {
        response: {
          userConsent: 'kvm',
          optInState: 0,
          redirection: true,
          KVM: true,
          SOL: true,
          IDER: false
        }
      }
    }
  }
}

export { apiResponses, httpCodes }
