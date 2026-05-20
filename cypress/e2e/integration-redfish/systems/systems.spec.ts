/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Redfish Computer Systems API Tests
 *
 * Endpoints covered:
 *   GET   /redfish/v1/Systems                                               (auth required)
 *   GET   /redfish/v1/Systems/{ComputerSystemId}                            (auth required)
 *   PATCH /redfish/v1/Systems/{ComputerSystemId}                            (auth required)
 *   POST  /redfish/v1/Systems/{ComputerSystemId}/Actions/ComputerSystem.Reset (auth required)
 *
 * The {ComputerSystemId} parameter must be a valid UUID/GUID.
 * Tests that target a specific device use the REDFISH_SYSTEM_ID env variable.
 * When ISOLATE=Y, device-specific positive tests may tolerate device-unavailable
 * statuses (for isolated/off-device runs). When ISOLATE=N, those same tests
 * require strict on-device success and reject 404/internal error responses.
 */

import { httpCodes } from '../../fixtures/api/httpCodes'
import { systemsFixtures } from '../../fixtures/api/redfish/systems'
import { basicAuthHeaders, createSystemIdResolver, deviceAllowedStatuses, redfishUrl } from '../helpers/redfish'

const systemId = createSystemIdResolver(systemsFixtures.testSystemId)

const expectAllowedDeviceStatus = (
  actualStatus: number,
  successStatuses: number | number[],
  statusesAllowedInAllModes: number[] = []
): void => {
  const normalizedSuccessStatuses = Array.isArray(successStatuses) ? successStatuses : [successStatuses]
  const allowedStatuses = deviceAllowedStatuses(
    [...normalizedSuccessStatuses, ...statusesAllowedInAllModes],
    [404, httpCodes.INTERNAL_SERVER_ERROR]
  )

  expect(actualStatus).to.be.oneOf(allowedStatuses)
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/Systems
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Systems Collection - GET /redfish/v1/Systems', () => {
  context('TC_SYSTEMS_GET_COLLECTION - authenticated GET returns ComputerSystemCollection with OData headers', () => {
    it('returns ComputerSystemCollection with @odata.type, Members array, and OData headers using Basic Auth', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/Systems`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.headers['content-type']).to.include('application/json')
        expect(response.headers['odata-version']).to.eq('4.0')
        expect(response.body['@odata.type']).to.include('ComputerSystemCollection')
        expect(response.body).to.have.property('Name', systemsFixtures.collection.success.response.Name)
        expect(response.body).to.have.property('Members')
        expect(response.body.Members).to.be.an('array')
        expect(response.body).to.have.property('Members@odata.count')
      })
    })

    it('returns @odata.id with value /redfish/v1/Systems in the collection response', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/Systems`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.body).to.have.property('@odata.id', '/redfish/v1/Systems')
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/Systems`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/Systems/{ComputerSystemId}
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - GET /redfish/v1/Systems/{ComputerSystemId}', () => {
  context('TC_SYSTEM_GET_BY_ID - valid UUID returns ComputerSystem or 404; non-UUID returns 400', () => {
    it('returns HTTP 400 for a system ID that is not a valid UUID format', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/Systems/not-a-valid-uuid`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.BAD_REQUEST)
      })
    })

    it('returns ComputerSystem resource or HTTP 404 when system ID is a valid UUID', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
        headers: basicAuthHeaders(),
        failOnStatusCode: false
      }).then((response) => {
        expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
        if (response.status === httpCodes.SUCCESS) {
          expect(response.body['@odata.type']).to.include('ComputerSystem')
          expect(response.body).to.have.property('Id', systemId())
          expect(response.body).to.have.property('@odata.id', `/redfish/v1/Systems/${systemId()}`)
        }
      })
    })

    it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /redfish/v1/Systems/{ComputerSystemId}
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - PATCH /redfish/v1/Systems/{ComputerSystemId}', () => {
  context(
    'TC_SYSTEM_PATCH_BOOT_SETTINGS - valid UUID updates boot settings or returns 404; non-UUID returns 400',
    () => {
      it('returns HTTP 400 when PATCH uses a non-UUID system ID', () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/not-a-valid-uuid`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.request,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.BAD_REQUEST)
        })
      })

      it('returns updated ComputerSystem resource or HTTP 404 when patching Boot settings', () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.request,
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body['@odata.type']).to.include('ComputerSystem')
          }
        })
      })

      it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          body: systemsFixtures.patchBootSettings.request,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/Systems/{id} — detailed property assertions (device-guarded)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - Detailed Properties', () => {
  context(
    'TC_SYSTEM_RESOURCE_FIELD_SCHEMA - ComputerSystem resource fields conform to Redfish DSP0268 schema values',
    () => {
      it('PowerState field value matches a valid Redfish PowerState enum', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body).to.have.property('PowerState')
            if (response.body.PowerState) {
              expect(systemsFixtures.validPowerStates).to.include(response.body.PowerState)
            }
          }
        })
      })

      it('SystemType field value matches a valid Redfish SystemType enum', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body).to.have.property('SystemType')
            if (response.body.SystemType) {
              expect(systemsFixtures.validSystemTypes).to.include(response.body.SystemType)
            }
          }
        })
      })

      it('Status object contains valid State and Health enum values conforming to DSP0268', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS && response.body.Status) {
            const { Status } = response.body as { Status: Record<string, string> }
            expect(Status).to.be.an('object')
            if (Status.State) {
              expect(systemsFixtures.validStatusStates).to.include(Status.State)
            }
            if (Status.Health) {
              expect(systemsFixtures.validHealthValues).to.include(Status.Health)
            }
            if (Status.HealthRollup) {
              expect(systemsFixtures.validHealthValues).to.include(Status.HealthRollup)
            }
          }
        })
      })

      it('BiosVersion field is a string type when present in the resource', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body).to.have.property('BiosVersion')
            if (response.body.BiosVersion != null) {
              expect(response.body.BiosVersion).to.be.a('string')
            }
          }
        })
      })

      it('Manufacturer, Model, and SerialNumber fields are string type when present', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            if (response.body.Manufacturer != null) {
              expect(response.body.Manufacturer).to.be.a('string')
            }
            if (response.body.Model != null) {
              expect(response.body.Model).to.be.a('string')
            }
            if (response.body.SerialNumber != null) {
              expect(response.body.SerialNumber).to.be.a('string')
            }
          }
        })
      })

      it('Actions[#ComputerSystem.Reset] target URL matches the ComputerSystem Reset action path', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body).to.have.property('Actions')
            expect(response.body.Actions).to.have.property('#ComputerSystem.Reset')
            const resetAction = response.body.Actions['#ComputerSystem.Reset'] as { target: string }
            expect(resetAction).to.have.property('target')
            expect(resetAction.target).to.equal(`/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`)
          }
        })
      })

      it('MemorySummary contains TotalSystemMemoryGiB as a positive number when present', { retries: 2 }, () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false,
          timeout: 45000
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS && response.body.MemorySummary) {
            const mem = response.body.MemorySummary as Record<string, unknown>
            expect(mem).to.be.an('object')
            if (mem.TotalSystemMemoryGiB != null) {
              expect(mem.TotalSystemMemoryGiB).to.be.a('number')
              expect(mem.TotalSystemMemoryGiB as number).to.be.greaterThan(0)
            }
            if (mem.MemoryMirroring != null) {
              expect(systemsFixtures.validMemoryMirroring).to.include(mem.MemoryMirroring as string)
            }
          }
        })
      })

      it('ProcessorSummary contains Count as positive number and Model as string when present', { retries: 2 }, () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false,
          timeout: 45000
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS && response.body.ProcessorSummary) {
            const proc = response.body.ProcessorSummary as Record<string, unknown>
            expect(proc).to.be.an('object')
            if (proc.Count != null) {
              expect(proc.Count).to.be.a('number')
              expect(proc.Count as number).to.be.greaterThan(0)
            }
            if (proc.Model != null) {
              expect(proc.Model).to.be.a('string')
            }
          }
        })
      })

      it('returns exact @odata.context, @odata.id, and Id values matching the requested system', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body['@odata.context']).to.equal('/redfish/v1/$metadata#ComputerSystem.ComputerSystem')
            expect(response.body['@odata.id']).to.equal(`/redfish/v1/Systems/${systemId()}`)
            expect(response.body).to.have.property('Id', systemId())
          }
        })
      })

      it('returns HTTP 404 with error object for a valid UUID that has no matching system record', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemsFixtures.nonExistentSystemId}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(404)
          expect(response.body).to.have.property('error')
        })
      })
    }
  )
})
// ─────────────────────────────────────────────────────────────────────────────
// Method Not Allowed on /redfish/v1/Systems/{ComputerSystemId}
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - Method Not Allowed', () => {
  context(
    'TC_SYSTEM_METHOD_NOT_ALLOWED - POST PUT DELETE on /redfish/v1/Systems/{id} return 405 with Redfish error body',
    () => {
      it('returns HTTP 405 with OData-Version header and error body for POST on system resource', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: {},
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(405)
          expect(response.headers['odata-version']).to.eq('4.0')
          expect(response.body).to.have.property('error')
        })
      })

      it('returns HTTP 405 with OData-Version header and error body for PUT on system resource', () => {
        cy.request({
          method: 'PUT',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: {},
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(405)
          expect(response.headers['odata-version']).to.eq('4.0')
          expect(response.body).to.have.property('error')
        })
      })

      it('returns HTTP 405 with OData-Version header and error body for DELETE on system resource', () => {
        cy.request({
          method: 'DELETE',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(405)
          expect(response.headers['odata-version']).to.eq('4.0')
          expect(response.body).to.have.property('error')
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /redfish/v1/Systems/{ComputerSystemId} — additional validation cases
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - PATCH Additional Scenarios', () => {
  context(
    'TC_SYSTEM_PATCH_ADDITIONAL_SCENARIOS - BiosSetup target, invalid enums, empty body and malformed JSON each produce correct status',
    () => {
      it('returns HTTP 200 or 404 when patching BootSourceOverrideTarget to BiosSetup', { retries: 2 }, () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.biosSetup,
          failOnStatusCode: false,
          timeout: 45000
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body['@odata.type']).to.include('ComputerSystem')
          }
        })
      })

      it('returns HTTP 400 for an invalid BootSourceOverrideTarget enum value', () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.invalidTarget,
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.BAD_REQUEST)
          if (response.status === httpCodes.BAD_REQUEST) {
            expect(response.body).to.have.property('error')
          }
        })
      })

      it('returns HTTP 400 for an invalid BootSourceOverrideEnabled enum value', () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.invalidEnabled,
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.BAD_REQUEST)
          if (response.status === httpCodes.BAD_REQUEST) {
            expect(response.body).to.have.property('error')
          }
        })
      })

      it('returns HTTP 404 with error object when PATCH targets a UUID with no matching system', () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemsFixtures.nonExistentSystemId}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.request,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(404)
          expect(response.body).to.have.property('error')
        })
      })

      it('returns HTTP 200, 400, or 404 for a PATCH with an empty JSON body', { retries: 2 }, () => {
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.empty,
          failOnStatusCode: false,
          timeout: 45000
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, [httpCodes.SUCCESS, httpCodes.BAD_REQUEST])
        })
      })

      it('returns HTTP 400 for a truncated or malformed JSON body in PATCH request', () => {
        // Send raw truncated JSON to trigger parse error
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: { ...basicAuthHeaders(), 'Content-Type': 'application/json' },
          body: '{"Boot": {"BootSourceOverrideEnabled": "Once"',
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.BAD_REQUEST)
          if (response.status === httpCodes.BAD_REQUEST) {
            expect(response.body).to.have.property('error')
          }
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/Systems/{id} — optional properties + HEAD + edge IDs
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - Optional Properties and Method Edge Cases', () => {
  context(
    'TC_SYSTEM_OPTIONAL_FIELDS_AND_HEAD - optional string fields are typed correctly and HEAD returns headers-only response',
    () => {
      it('Description and HostName fields are string type when present in the resource', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.SUCCESS)
          if (response.status === httpCodes.SUCCESS) {
            if (response.body.Description != null) {
              expect(response.body.Description).to.be.a('string')
            }
            if (response.body.HostName != null) {
              expect(response.body.HostName).to.be.a('string')
            }
          }
        })
      })

      it('returns HTTP 200 with empty body or HTTP 405 for HEAD on the system resource', () => {
        cy.request({
          method: 'HEAD',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, [httpCodes.SUCCESS, 405])
          if (response.status === httpCodes.SUCCESS) {
            expect(response.headers['odata-version']).to.eq('4.0')
            expect(response.headers['content-type']).to.include('application/json')
            expect(response.body).to.satisfy(
              (b: unknown) => b === '' || b === null || (typeof b === 'object' && Object.keys(b as object).length === 0)
            )
          }
        })
      })

      it('returns HTTP 200 collection or HTTP 404 for GET with an empty system ID path segment', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems/`,
          headers: basicAuthHeaders(),
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([httpCodes.SUCCESS, 404])
          if (response.status === httpCodes.SUCCESS) {
            expect(response.body).to.satisfy((b: Record<string, unknown>) => 'Members' in b || '@odata.type' in b)
          }
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Security / Input Validation Edge Cases  (Postman #42–48)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Computer System - Security Edge Cases', () => {
  context(
    'TC_SYSTEM_INPUT_VALIDATION_SECURITY - XSS, SQL injection, path traversal and oversized IDs all return 400 or 404',
    () => {
      const badIds: { label: string; path: string }[] = [
        { label: 'XSS attempt', path: "<script>alert('xss')</script>" },
        { label: 'SQL injection', path: "' OR '1'='1" },
        // Use percent-encoding so traversal markers are preserved in the route segment
        // and not normalized by the client/router before request handling.
        // { label: 'path traversal',        path: '../../../etc/passwd' },
        { label: 'path traversal', path: '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd' },
        { label: 'null byte', path: 'system%00id' },
        { label: 'unicode chars', path: encodeURIComponent('系统标识符') },
        { label: 'long ID (51 chars)', path: 'a'.repeat(51) },
        { label: 'very long ID (1024)', path: 'a'.repeat(1024) }
      ]

      badIds.forEach(({ label, path }) => {
        it(`returns 400 or 404 for ${label} in system ID`, () => {
          cy.request({
            method: 'GET',
            url: `${redfishUrl()}/redfish/v1/Systems/${path}`,
            headers: basicAuthHeaders(),
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.be.oneOf([
              httpCodes.BAD_REQUEST,
              404,
              414
            ])
            if (response.headers['content-type']?.includes('application/json')) {
              expect(response.body).to.have.property('error')
            }
          })
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /redfish/v1/Systems/{ComputerSystemId}/Actions/ComputerSystem.Reset
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish System Reset Action - POST /redfish/v1/Systems/{ComputerSystemId}/Actions/ComputerSystem.Reset', () => {
  context(
    'TC_SYSTEM_RESET_INPUT_VALIDATION - reset request validated and accepted or rejected based on input and device state',
    () => {
      it('returns HTTP 400 for a non-UUID system ID in Reset action URL', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/Systems/not-a-valid-uuid/Actions/ComputerSystem.Reset`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.reset.request,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.BAD_REQUEST)
        })
      })

      it('returns HTTP 400 when ResetType field is absent from the Reset request body', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.reset.missingResetType,
          failOnStatusCode: false
        }).then((response) => {
          expectAllowedDeviceStatus(response.status, httpCodes.BAD_REQUEST)
        })
      })

      it('returns HTTP 202 Accepted for a valid reset request, or 404/409 when device is unavailable', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.reset.request,
          failOnStatusCode: false
        }).then((response) => {
          // 202 Accepted (success), 404 (device not found/registered),
          // or 409 Conflict (device busy — previous reset still in progress)
          expectAllowedDeviceStatus(response.status, 202, [409])
          if (response.status === 202) {
            expect(response.body).to.have.property('@odata.type')
            expect(response.body['@odata.type']).to.include('Task')
            expect(response.body).to.have.property('TaskState', 'Completed')
            expect(response.body).to.have.property('TaskStatus', 'OK')
            expect(response.headers).to.have.property('location')
          }
        })
      })

      it('returns HTTP 401 Unauthorized when request has no authentication headers', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
          body: systemsFixtures.reset.request,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
        })
      })

      it('returns HTTP 400 with Redfish error @Message.ExtendedInfo for an invalid ResetType value', () => {
        cy.request({
          method: 'POST',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.reset.invalidResetType,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.BAD_REQUEST)
          expect(response.body).to.have.property('error')
          expect(response.body.error).to.have.property('@Message.ExtendedInfo')
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// POST .../Actions/ComputerSystem.Reset — all supported ResetTypes
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish System Reset Action - All ResetTypes', () => {
  context(
    'TC_SYSTEM_RESET_ALL_RESET_TYPES - each supported ResetType returns 202 Accepted or device-unavailable code',
    () => {
      const cases = [
        { label: 'On', body: () => systemsFixtures.reset.on },
        { label: 'ForceOff', body: () => systemsFixtures.reset.forceOff },
        { label: 'ForceRestart', body: () => systemsFixtures.reset.forceRestart },
        { label: 'GracefulRestart', body: () => systemsFixtures.reset.gracefulRestart },
        { label: 'PowerCycle', body: () => systemsFixtures.reset.powerCycle }
      ]

      cases.forEach(({ label, body }) => {
        // Each Reset relays to the AMT device over WSMAN. When multiple Resets
        // are sent in quick succession the device may take longer than the default
        // 15 s responseTimeout to reply. timeout:45000 gives it enough headroom,
        // and retries:2 absorbs transient ECONNRESET drops between resets.
        it(`accepts ResetType=${label} — 202 on success, 404/409 when device unavailable`, { retries: 2 }, () => {
          cy.request({
            method: 'POST',
            url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
            headers: basicAuthHeaders(),
            body: body(),
            failOnStatusCode: false,
            timeout: 45000
          }).then((response) => {
            expectAllowedDeviceStatus(response.status, 202, [409])
            if (response.status === 202) {
              expect(response.body['@odata.type']).to.include('Task')
              expect(response.body).to.have.property('TaskState', 'Completed')
              expect(response.body).to.have.property('TaskStatus', 'OK')
              expect(response.headers).to.have.property('location')
              expect(response.headers.location).to.include('/redfish/v1/TaskService/Tasks/')
              expect(response.headers['odata-version']).to.eq('4.0')
            }
          })
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Reset — malformed JSON body (Postman #67)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish System Reset Action - Malformed JSON', () => {
  context('TC_SYSTEM_RESET_MALFORMED_JSON - truncated JSON body in Reset request returns 400 Bad Request', () => {
    it('returns HTTP 400 for a truncated or malformed JSON body in Reset action request', () => {
      cy.request({
        method: 'POST',
        url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
        headers: { ...basicAuthHeaders(), 'Content-Type': 'application/json' },
        body: '{"ResetType": "On"',
        failOnStatusCode: false
      }).then((response) => {
        expectAllowedDeviceStatus(response.status, httpCodes.BAD_REQUEST)
        if (response.status === httpCodes.BAD_REQUEST) {
          expect(response.body).to.have.property('error')
        }
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Authentication — error body structure (Postman #68)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Authentication - Error Body Structure', () => {
  context(
    'TC_AUTH_UNAUTHORIZED_ERROR_STRUCTURE - unauthenticated and invalid credential requests return 401 with Redfish error body',
    () => {
      it('returns HTTP 401 with @Message.ExtendedInfo array for unauthenticated request to /redfish/v1/Systems', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
          expect(response.headers['content-type']).to.include('application/json')
          expect(response.headers['odata-version']).to.eq('4.0')
          expect(response.body).to.have.property('error')
          expect(response.body.error).to.have.property('@Message.ExtendedInfo')
          expect(response.body.error['@Message.ExtendedInfo']).to.be.an('array')
        })
      })

      it('returns HTTP 401 for request with invalid Basic Auth credentials on /redfish/v1/Systems', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/Systems`,
          headers: { Authorization: `Basic ${btoa('invalid_user:invalid_password')}` },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.UNAUTHORIZED)
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling — invalid endpoint (Postman #71)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Error Handling - Invalid Endpoint', () => {
  context('TC_ERROR_HANDLING_INVALID_ENDPOINT - GET to an undefined Redfish path returns 404 Not Found', () => {
    it('returns HTTP 404 for GET to an undefined Redfish endpoint /redfish/v1/InvalidEndpoint', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/InvalidEndpoint`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Complete BIOS Reset Flow — PATCH BiosSetup then POST ForceRestart (Postman #58)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Complete BIOS Reset Flow', () => {
  context(
    'TC_SYSTEM_BIOS_RESET_FLOW - set BiosSetup boot override via PATCH then POST ForceRestart returns 202 Task or device-unavailable',
    () => {
      it('PATCH BiosSetup boot override then POST ForceRestart returns HTTP 202 Task or device-unavailable code', () => {
        // Step 1: set boot override to BiosSetup
        cy.request({
          method: 'PATCH',
          url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}`,
          headers: basicAuthHeaders(),
          body: systemsFixtures.patchBootSettings.biosSetup,
          failOnStatusCode: false
        }).then((patchResponse) => {
          expectAllowedDeviceStatus(patchResponse.status, httpCodes.SUCCESS)
          // Only proceed to reset if PATCH succeeded
          if (patchResponse.status === httpCodes.SUCCESS) {
            cy.request({
              method: 'POST',
              url: `${redfishUrl()}/redfish/v1/Systems/${systemId()}/Actions/ComputerSystem.Reset`,
              headers: basicAuthHeaders(),
              body: systemsFixtures.reset.forceRestart,
              failOnStatusCode: false
            }).then((resetResponse) => {
              expectAllowedDeviceStatus(resetResponse.status, 202, [409])
              if (resetResponse.status === 202) {
                expect(resetResponse.body['@odata.type']).to.include('Task')
                expect(resetResponse.body).to.have.property('TaskState', 'Completed')
                expect(resetResponse.body).to.have.property('TaskStatus', 'OK')
                expect(resetResponse.headers).to.have.property('location')
                expect(resetResponse.headers.location).to.include('/redfish/v1/TaskService/Tasks/')
              }
            })
          } else {
            cy.log(`Skipping reset step: PATCH returned ${patchResponse.status} (device not available)`)
          }
        })
      })
    }
  )
})
