/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Fixtures for Redfish Service Root, OData metadata and OData service document tests.
 * Covers: GET /redfish/v1/  |  GET /redfish/v1/$metadata  |  GET /redfish/v1/odata
 */

const servicerootFixtures = {
  serviceRoot: {
    success: {
      response: {
        '@odata.context': '/redfish/v1/$metadata#ServiceRoot.ServiceRoot',
        '@odata.id': '/redfish/v1',
        '@odata.type': '#ServiceRoot.v1_19_0.ServiceRoot',
        Id: 'RootService',
        Name: 'Root Service',
        RedfishVersion: '1.19.0',
        Systems: { '@odata.id': '/redfish/v1/Systems' },
        SessionService: { '@odata.id': '/redfish/v1/SessionService' }
      }
    }
  },

  odata: {
    success: {
      response: {
        '@odata.context': '/redfish/v1/$metadata#ServiceRoot.ServiceRoot',
        value: [
          { name: 'Systems', kind: 'Singleton', url: '/redfish/v1/Systems' },
          { name: 'SessionService', kind: 'Singleton', url: '/redfish/v1/SessionService' }
        ]
      }
    }
  }
}

export { servicerootFixtures }
