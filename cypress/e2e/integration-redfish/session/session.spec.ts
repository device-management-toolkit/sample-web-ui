/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Redfish SessionService API Tests
 *
 * Endpoints covered:
 *   GET    /redfish/v1/SessionService                             (auth required)
 *   PATCH  /redfish/v1/SessionService                             (auth required)
 *   PUT    /redfish/v1/SessionService                             (auth required)
 *   GET    /redfish/v1/SessionService/Sessions                    (auth required)
 *   POST   /redfish/v1/SessionService/Sessions                    (PUBLIC — login)
 *   GET    /redfish/v1/SessionService/Sessions/{SessionId}        (auth required)
 *   DELETE /redfish/v1/SessionService/Sessions/{SessionId}        (auth required)
 *
 * Authentication:
 *   - Protected endpoints accept Basic Auth OR X-Auth-Token header.
 *   - POST /redfish/v1/SessionService/Sessions requires NO prior auth (it IS the login).
 */

import { httpCodes } from '../../fixtures/api/httpCodes'
import { sessionFixtures } from '../../fixtures/api/redfish/session'

const redfishUrl = (): string => Cypress.env('REDFISH_BASEURL') ?? 'http://localhost:8181'

const basicAuthHeaders = (): Record<string, string> => {
  const username = (Cypress.env('REDFISH_USERNAME') as string) ?? 'standalone'
  const password = (Cypress.env('REDFISH_PASSWORD') as string) ?? 'G@ppm0ym'
  return { Authorization: `Basic ${btoa(`${username}:${password}`)}` }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET/PATCH/PUT /redfish/v1/SessionService
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish SessionService - GET/PATCH/PUT /redfish/v1/SessionService', () => {
  context(
    'TC_SESSIONSERVICE_GET_RESOURCE - GET returns SessionService document with @odata.type and Sessions link',
    () => {
      it('returns SessionService resource with @odata.type and Sessions link using Basic Auth', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/SessionService`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.have.property('@odata.context')
          expect(response.body['@odata.type']).to.include('SessionService')
          expect(response.body).to.have.property('Id', sessionFixtures.sessionService.success.response.Id)
          expect(response.body).to.have.property('Name', sessionFixtures.sessionService.success.response.Name)
          expect(response.body).to.have.property('Sessions')
          expect(response.body.Sessions).to.have.property('@odata.id', '/redfish/v1/SessionService/Sessions')
        })
      })

      it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/SessionService`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
        })
      })
    }
  )

  context('TC_SESSIONSERVICE_PATCH_RESOURCE - PATCH updates and returns current SessionService state', () => {
    it('returns updated SessionService resource body using Basic Auth', () => {
      cy.request({
        method: 'PATCH',
        url: `${redfishUrl()}/redfish/v1/SessionService`,
        headers: basicAuthHeaders(),
        body: { SessionTimeout: 1800 },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.body['@odata.type']).to.include('SessionService')
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'PATCH',
        url: `${redfishUrl()}/redfish/v1/SessionService`,
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })

  context('TC_SESSIONSERVICE_PUT_RESOURCE - PUT returns current SessionService state', () => {
    it('returns current SessionService resource body with an empty request body using Basic Auth', () => {
      cy.request({
        method: 'PUT',
        url: `${redfishUrl()}/redfish/v1/SessionService`,
        headers: basicAuthHeaders(),
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.body['@odata.type']).to.include('SessionService')
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'PUT',
        url: `${redfishUrl()}/redfish/v1/SessionService`,
        body: {},
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET/POST /redfish/v1/SessionService/Sessions
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Sessions Collection - GET/POST /redfish/v1/SessionService/Sessions', () => {
  before(() => {
    // Delete any sessions left over from previous test runs so POST tests start clean
    cy.request({
      method: 'GET',
      url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
      headers: basicAuthHeaders(),
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === httpCodes.SUCCESS) {
        const members = response.body.Members as { '@odata.id': string }[]
        members.forEach((m) => {
          cy.request({
            method: 'DELETE',
            url: `${redfishUrl()}${m['@odata.id']}`,
            headers: basicAuthHeaders(),
            failOnStatusCode: false
          })
        })
      }
    })
  })

  context('TC_SESSIONS_POST_LOGIN - POST creates a session without prior authentication required', () => {
    it('returns HTTP 201 with X-Auth-Token and Location header when using valid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        body: sessionFixtures.validCredentials.request,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.CREATED)
        expect(response.headers).to.have.property('x-auth-token')
        expect(response.headers['x-auth-token']).to.be.a('string').and.not.equal('')
        expect(response.headers).to.have.property('location')
        expect(response.headers.location).to.include('/redfish/v1/SessionService/Sessions/')
        // Cleanup: delete the session so subsequent tests start with no active session
        const token = response.headers['x-auth-token'] as string
        const sid = (response.body as { Id: string }).Id
        cy.request({
          method: 'DELETE',
          url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${sid}`,
          headers: { 'X-Auth-Token': token },
          failOnStatusCode: false
        })
      })
    })

    it('returns Session resource with @odata.type, Id, and UserName on successful login', () => {
      cy.request({
        method: 'POST',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        body: sessionFixtures.validCredentials.request,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.CREATED)
        expect(response.body['@odata.type']).to.include('Session')
        expect(response.body).to.have.property('Id')
        expect(response.body).to.have.property('UserName', sessionFixtures.validCredentials.request.UserName)
        // Cleanup: delete the session so subsequent tests start with no active session
        const token = response.headers['x-auth-token'] as string
        const sid = (response.body as { Id: string }).Id
        cy.request({
          method: 'DELETE',
          url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${sid}`,
          headers: { 'X-Auth-Token': token },
          failOnStatusCode: false
        })
      })
    })

    it('returns HTTP 401 Unauthorized for incorrect username and password', () => {
      cy.request({
        method: 'POST',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        body: sessionFixtures.invalidCredentials.request,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })

    it('returns HTTP 400 or 401 when UserName and Password fields are missing from request body', () => {
      cy.request({
        method: 'POST',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        body: sessionFixtures.missingFields.request,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([httpCodes.BAD_REQUEST, httpCodes.UNAUTHORIZED])
      })
    })
  })

  context('TC_SESSIONS_GET_COLLECTION - GET returns SessionCollection with members array and count', () => {
    it('returns SessionCollection resource with @odata.type, Members array, and count using Basic Auth', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.body['@odata.type']).to.include('SessionCollection')
        expect(response.body).to.have.property('Name', sessionFixtures.sessionCollection.success.response.Name)
        expect(response.body).to.have.property('Members')
        expect(response.body.Members).to.be.an('array')
        expect(response.body).to.have.property('Members@odata.count')
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET/DELETE /redfish/v1/SessionService/Sessions/{SessionId}
// Uses session created via POST; token stored in before() hook.
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Individual Session - GET/DELETE /redfish/v1/SessionService/Sessions/{SessionId}', () => {
  let authToken: string
  let sessionId: string

  before(() => {
    cy.request({
      method: 'POST',
      url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
      body: sessionFixtures.validCredentials.request,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === httpCodes.CREATED) {
        authToken = response.headers['x-auth-token'] as string
        sessionId = response.body.Id as string
      }
    })
  })

  context('TC_SESSION_GET_BY_ID - GET returns individual Session resource using X-Auth-Token or Basic Auth', () => {
    it('returns Session resource with Id and UserName using X-Auth-Token header', () => {
      if (!authToken || !sessionId) {
        cy.log('Skipping: login failed in before()')
        return
      }

      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${sessionId}`,
        headers: { 'X-Auth-Token': authToken },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.body).to.have.property('Id', sessionId)
        expect(response.body['@odata.type']).to.include('Session')
        expect(response.body).to.have.property('UserName', sessionFixtures.validCredentials.request.UserName)
      })
    })

    it('returns HTTP 404 for a session ID that does not exist in the system', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/00000000-does-not-exist`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/someid`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })

  context('TC_SESSION_DELETE_BY_ID - DELETE removes active session (logout) and returns 204', () => {
    it('returns HTTP 204 and removes the active session when using X-Auth-Token header (logout)', () => {
      if (!authToken || !sessionId) {
        cy.log('Skipping: login failed in before()')
        return
      }

      cy.request({
        method: 'DELETE',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${sessionId}`,
        headers: { 'X-Auth-Token': authToken },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.NO_CONTENT)
      })
    })

    it('returns HTTP 404 when attempting to delete a session ID that does not exist', () => {
      cy.request({
        method: 'DELETE',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/00000000-does-not-exist`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'DELETE',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/someid`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Token and session lifecycle edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Session - Token Lifecycle Edge Cases', () => {
  context('TC_SESSION_TOKEN_VALIDATION - invalid and deleted session tokens are rejected with 401', () => {
    it('returns HTTP 401 with error body when X-Auth-Token is an invalid or garbage value', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        headers: { 'X-Auth-Token': 'invalid-token-that-does-not-exist-12345' },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
        expect(response.body).to.have.property('error')
      })
    })

    it('returns HTTP 401 or 404 when using a token from an already-deleted session', () => {
      let deletedToken: string
      let deletedSessionId: string

      // Create a session
      cy.request({
        method: 'POST',
        url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
        body: sessionFixtures.validCredentials.request,
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === httpCodes.CREATED) {
          deletedToken = response.headers['x-auth-token'] as string
          deletedSessionId = response.body.Id as string

          // Delete the session
          cy.request({
            method: 'DELETE',
            url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${deletedSessionId}`,
            headers: { 'X-Auth-Token': deletedToken },
            failOnStatusCode: false
          }).then((delResponse) => {
            expect(delResponse.status).to.eq(httpCodes.NO_CONTENT)

            // Now use the deleted token — should be 401 or 404
            cy.request({
              method: 'GET',
              url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${deletedSessionId}`,
              headers: { 'X-Auth-Token': deletedToken },
              failOnStatusCode: false
            }).then((getResponse) => {
              expect(getResponse.status).to.be.oneOf([httpCodes.UNAUTHORIZED, 404])
              expect(getResponse.body).to.have.property('error')
            })
          })
        }
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SessionService resource — additional property checks
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish SessionService - Additional Properties', () => {
  context(
    'TC_SESSIONSERVICE_ADDITIONAL_PROPERTIES - ServiceEnabled state, member count and method restrictions',
    () => {
      it('GET SessionService resource returns ServiceEnabled set to true', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/SessionService`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.have.property('ServiceEnabled', true)
        })
      })

      it('Sessions collection returns Members@odata.count as a non-negative integer', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body['Members@odata.count']).to.be.a('number')
          expect(response.body['Members@odata.count']).to.be.at.least(0)
          if ((response.body['Members@odata.count'] as number) > 0) {
            const members = response.body.Members as { '@odata.id': string }[]
            expect(members[0]).to.have.property('@odata.id')
            expect(members[0]['@odata.id']).to.include('/redfish/v1/SessionService/Sessions/')
          }
        })
      })

      it('returns HTTP 405 Method Not Allowed for POST on /redfish/v1/SessionService', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/SessionService`,
          headers: basicAuthHeaders(),
          body: {},
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(405)
          expect(response.body).to.have.property('error')
        })
      })

      it('POST Sessions response includes OData-Version: 4.0 header on successful login', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/SessionService/Sessions`,
          body: sessionFixtures.validCredentials.request,
          failOnStatusCode: false
        }).then((loginResponse) => {
          expect(loginResponse.status).to.eq(httpCodes.CREATED)
          expect(loginResponse.headers['odata-version']).to.eq('4.0')

          // Cleanup: delete the session we just created
          const token = loginResponse.headers['x-auth-token'] as string
          const sid = loginResponse.body.Id as string
          cy.request({
            method: 'DELETE',
            url: `${redfishUrl()}/redfish/v1/SessionService/Sessions/${sid}`,
            headers: { 'X-Auth-Token': token },
            failOnStatusCode: false
          })
        })
      })
    }
  )
})
