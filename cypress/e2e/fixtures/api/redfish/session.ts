/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Fixtures for Redfish SessionService API tests.
 * Covers: GET/PATCH/PUT /redfish/v1/SessionService
 *         GET/POST      /redfish/v1/SessionService/Sessions
 *         GET/DELETE    /redfish/v1/SessionService/Sessions/{SessionId}
 *
 * NOTE: Redfish session login uses { UserName, Password } (capital letters),
 *       NOT { username, password } used by the proprietary /api/v1/authorize endpoint.
 */

const sessionFixtures = {
  validCredentials: {
    request: {
      UserName: 'standalone',
      Password: 'G@ppm0ym'
    }
  },

  invalidCredentials: {
    request: {
      UserName: 'wronguser',
      Password: 'wrongpass'
    }
  },

  missingFields: {
    request: {}
  },

  sessionService: {
    success: {
      response: {
        '@odata.context': '/redfish/v1/$metadata#SessionService.SessionService',
        '@odata.id': '/redfish/v1/SessionService',
        '@odata.type': '#SessionService.v1_2_0.SessionService',
        Id: 'SessionService',
        Name: 'Session Service',
        Sessions: { '@odata.id': '/redfish/v1/SessionService/Sessions' }
      }
    }
  },

  sessionCollection: {
    success: {
      response: {
        '@odata.context': '/redfish/v1/$metadata#SessionCollection.SessionCollection',
        '@odata.id': '/redfish/v1/SessionService/Sessions',
        '@odata.type': '#SessionCollection.SessionCollection',
        Name: 'Session Collection'
      }
    }
  }
}

export { sessionFixtures }
