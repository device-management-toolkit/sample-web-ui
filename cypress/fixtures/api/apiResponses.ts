import { ciraFixtures } from '../cira'
import { profileFixtures } from '../profile'

/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const apiResponses = {
  login: {
    success: {
      code: 200
    },
    fail: {
      code: 401,
      response: {
        error: 'string',
        message: 'string'
      }
    }
  },
  logout: {
    success: {
      code: 200
    }
  },
  domains: {
    getAll: {
      success: {
        code: 200,
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
        code: 200,
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      forPaging: {
        code: 200,
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
        code: 201,
        response: {
          profileName: 'happyPath',
          domainSuffix: 'happyPath.com',
          provisioningCert: 'test',
          provisioningCertStorageFormat: 'raw',
          provisioningCertPassword: 'P@ssw0rd'
        }
      },
      badRequest: {
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    update: {
      success: {
        code: 200,
        response: {
          profileName: 'NewDomain',
          domainSuffix: 'NewDomain.com',
          provisioningCert: 'test',
          provisioningCertStorageFormat: 'raw',
          provisioningCertPassword: 'P@ssw0rd'
        }
      },
      badRequest: {
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    get: {
      success: {
        code: 200,
        response: {
          profileName: 'NewDomain',
          domainSuffix: 'NewDomain.com',
          provisioningCert: 'test',
          provisioningCertStorageFormat: 'raw',
          provisioningCertPassword: 'P@ssw0rd'
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        code: 204,
        response: {}
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
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
        code: 200,
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
        code: 200,
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      forProfile: {
        code: 200,
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
        code: 200,
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
        code: 201,
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
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    update: {
      success: {
        code: 200,
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
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    get: {
      success: {
        code: 200,
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
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        code: 204,
        response: {}
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
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
        code: 200,
        response: {
          data: [
            profileFixtures.happyPath,
            profileFixtures.happyPathTls
          ],
          totalCount: 2
        }
      },
      empty: {
        code: 200,
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      forPaging: {
        code: 200,
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
        code: 201,
        response: {
          profileName: 'happyPath',
          configurationScript: null,
          activation: 'ccmactivate',
          ciraConfigName: 'default',
          dhcpEnabled: true
        }
      },
      badRequest: {
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    update: {
      success: {
        code: 200,
        response: {
          profileName: 'profile6',
          amtPassword: 'Intel123!',
          mebxPassword: 'Intel123!',
          activation: 'activate'
        }
      },
      badRequest: {
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    get: {
      success: {
        code: 200,
        response: {
          profileName: 'profile6',
          amtPassword: 'Intel123!',
          mebxPassword: 'Intel123!',
          activation: 'activate'
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        code: 204,
        response: {}
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
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
        code: 200,
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
        code: 200,
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      tags: {
        code: 200,
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
        code: 200,
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
        code: 200,
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
        code: 200,
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
        code: 200,
        response: [
          {
            profileName: 'happyPath',
            dhcpEnabled: true
          }
        ]
      },
      empty: {
        code: 200,
        response: []
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    create: {
      success: {
        code: 201,
        response: {
          profileName: 'profile6',
          dhcpEnabled: true
        }
      },
      badRequest: {
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    update: {
      success: {
        code: 200,
        response: {
          profileName: 'profile6',
          dhcpEnabled: true
        }
      },
      badRequest: {
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    get: {
      success: {
        code: 200,
        response: {
          profileName: 'profile6',
          dhcpEnabled: true
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        code: 204,
        response: {}
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
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
        code: 200,
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
        code: 200,
        response: {
          data: [],
          totalCount: null
        }
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      forProfile: {
        code: 200,
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
        code: 200,
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
        code: 201,
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
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    update: {
      success: {
        code: 200,
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
        code: 400,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    get: {
      success: {
        code: 200,
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
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
        response: {
          error: 'string',
          message: 'string'
        }
      }
    },
    delete: {
      success: {
        code: 204,
        response: {}
      },
      notFound: {
        code: 404,
        response: {
          error: 'string',
          message: 'string'
        }
      },
      error: {
        code: 500,
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
        code: 200,
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
        code: 200,
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
        code: 200,
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
        code: 200,
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
        code: 200,
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
        code: 200,
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

export { apiResponses }
