/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Redfish Service Root, OData Metadata and OData Service Document API Tests
 *
 * Endpoints covered (all PUBLIC — no authentication required):
 *   GET /redfish/v1/             Service Root (JSON)
 *   GET /redfish/v1/$metadata    OData CSDL metadata document (XML)
 *   GET /redfish/v1/odata        OData service document (JSON)
 */

import { httpCodes } from '../../fixtures/api/httpCodes'
import { servicerootFixtures } from '../../fixtures/api/redfish/serviceroot'

const redfishUrl = (): string => Cypress.env('REDFISH_BASEURL') ?? 'http://localhost:8181'

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Service Root - GET /redfish/v1/', () => {
  context(
    'TC_SERVICEROOT_GET_WITHOUT_AUTH - public endpoint serves ServiceRoot document without authentication',
    () => {
      it('returns HTTP 200 with no authentication credentials', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
        })
      })

      it('returns content-type application/json and OData-Version 4.0 response header', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.headers['content-type']).to.include('application/json')
          expect(response.headers['odata-version']).to.eq('4.0')
        })
      })

      it('returns @odata.context, @odata.id, and @odata.type pointing to ServiceRoot', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.have.property('@odata.context')
          expect(response.body).to.have.property('@odata.id')
          expect(response.body).to.have.property('@odata.type')
          expect(response.body['@odata.type']).to.include('ServiceRoot')
          expect(response.body['@odata.id']).to.be.oneOf(['/redfish/v1', '/redfish/v1/'])
          // @odata.context must reference $metadata and ServiceRoot (Postman #3)
          expect(response.body['@odata.context']).to.include('$metadata')
          expect(response.body['@odata.context']).to.include('ServiceRoot')
        })
      })

      it('returns Id, Name, RedfishVersion (semver), and UUID in the ServiceRoot body', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.have.property('Id', servicerootFixtures.serviceRoot.success.response.Id)
          expect(response.body).to.have.property('Name', servicerootFixtures.serviceRoot.success.response.Name)
          expect(response.body).to.have.property('RedfishVersion')
          expect(response.body.RedfishVersion).to.match(/^\d+\.\d+\.\d+$/)
          expect(response.body).to.have.property('UUID')
          expect(response.body.UUID).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        })
      })

      it('contains Systems navigation link with @odata.id set to /redfish/v1/Systems', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.have.property('Systems')
          expect(response.body.Systems).to.have.property('@odata.id', '/redfish/v1/Systems')
        })
      })

      it('contains SessionService navigation link with @odata.id set to /redfish/v1/SessionService', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.have.property('SessionService')
          expect(response.body.SessionService).to.have.property('@odata.id', '/redfish/v1/SessionService')
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/$metadata
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish OData Metadata - GET /redfish/v1/$metadata', () => {
  context('TC_METADATA_GET_WITHOUT_AUTH - public endpoint serves OData CSDL metadata as application/xml', () => {
    it('returns HTTP 200 with no authentication credentials', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/$metadata`,
        failOnStatusCode: false,
        headers: { Accept: 'application/xml' }
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
      })
    })

    it('returns content-type application/xml and OData-Version 4.0 response header', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/$metadata`,
        failOnStatusCode: false,
        headers: { Accept: 'application/xml' }
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.headers['content-type']).to.include('application/xml')
        expect(response.headers['odata-version']).to.eq('4.0')
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/odata
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish OData Service Document - GET /redfish/v1/odata', () => {
  context('TC_ODATA_GET_SERVICE_ENTRIES - public endpoint serves OData service document with entry list', () => {
    it('returns HTTP 200 with no authentication credentials', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/odata`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
      })
    })

    it('returns content-type application/json response header', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/odata`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.headers['content-type']).to.include('application/json')
      })
    })

    it('returns @odata.context and a non-empty value array of service entries', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/odata`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        expect(response.body).to.have.property('@odata.context')
        expect(response.body).to.have.property('value')
        expect(response.body.value).to.be.an('array').and.have.length.gte(1)
      })
    })

    it('each service entry has name, kind (Singleton or EntitySet), and url properties', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/odata`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        response.body.value.forEach((entry: { name: string; kind: string; url: string }) => {
          expect(entry).to.have.property('name')
          expect(entry.name).to.be.a('string').and.not.equal('')
          expect(entry).to.have.property('kind')
          expect(['Singleton', 'EntitySet']).to.include(entry.kind)
          expect(entry).to.have.property('url')
          expect(entry.url).to.include('/redfish/v1/')
          expect(entry.url).to.not.include('$metadata')
          expect(entry.url).to.not.include('/odata')
        })
      })
    })

    it('service entries in value array are sorted alphabetically by name', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/odata`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        const names = (response.body.value as { name: string }[]).map((e) => e.name)
        const sorted = [...names].sort((a, b) => a.localeCompare(b))
        expect(names).to.deep.equal(sorted)
      })
    })

    it('includes Systems entry with kind Singleton and url /redfish/v1/Systems', () => {
      cy.request({
        method: 'GET',
        url: `${redfishUrl()}/redfish/v1/odata`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(httpCodes.SUCCESS)
        const systemsEntry = (response.body.value as { name: string; kind: string; url: string }[]).find(
          (e) => e.name === 'Systems'
        )
        expect(systemsEntry).to.not.equal(undefined)
        expect(systemsEntry?.kind).to.equal('Singleton')
        expect(systemsEntry?.url).to.equal('/redfish/v1/Systems')
      })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1  (no trailing slash)
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Service Root - No Trailing Slash', () => {
  context(
    'TC_SERVICEROOT_GET_NO_TRAILING_SLASH - GET /redfish/v1 without trailing slash returns 200 or redirect to /',
    () => {
      it('returns HTTP 200 or a 3xx redirect with Location pointing to /redfish/v1/', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1`,
          failOnStatusCode: false,
          followRedirect: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([
            200,
            301,
            302,
            307,
            308
          ])
          if (response.status === 200) {
            expect(response.body).to.have.property('@odata.id')
          }
          if ([
              301,
              302,
              307,
              308
            ].includes(response.status)) {
            expect(response.headers['location']).to.include('/redfish/v1/')
          }
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /redfish/v1/$metadata — XML content assertions
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish OData Metadata - XML Content', () => {
  context(
    'TC_METADATA_XML_CONTENT_VALIDATION - EDMX document structure contains required namespace and schema references',
    () => {
      it('returns a non-empty string response body', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/$metadata`,
          failOnStatusCode: false,
          headers: { Accept: 'application/xml' }
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          expect(response.body).to.be.a('string').and.have.length.greaterThan(0)
        })
      })

      it('contains XML declaration and edmx:Edmx root element with OASIS edmx namespace', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/$metadata`,
          failOnStatusCode: false,
          headers: { Accept: 'application/xml' }
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          const xml = response.body as string
          expect(xml).to.include('<?xml version')
          expect(xml).to.include('<edmx:Edmx')
          expect(xml).to.include('http://docs.oasis-open.org/odata/ns/edmx')
        })
      })

      it('contains ServiceRoot, ComputerSystem, and Resource namespace references', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/$metadata`,
          failOnStatusCode: false,
          headers: { Accept: 'application/xml' }
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          const xml = response.body as string
          expect(xml).to.include('ServiceRoot')
          expect(xml).to.include('ComputerSystem')
          expect(xml).to.include('Resource')
        })
      })

      it('contains edmx:Reference and edmx:DataServices structural elements', () => {
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/$metadata`,
          failOnStatusCode: false,
          headers: { Accept: 'application/xml' }
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          const xml = response.body as string
          expect(xml).to.include('edmx:Reference')
          expect(xml).to.include('edmx:DataServices')
        })
      })

      it('returns identical body on repeated requests confirming idempotent response', () => {
        let firstBody: string
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/$metadata`,
          failOnStatusCode: false,
          headers: { Accept: 'application/xml' }
        }).then((response) => {
          expect(response.status).to.eq(httpCodes.SUCCESS)
          firstBody = response.body as string
        })
        cy.request({
          method: 'GET',
          url: `${redfishUrl()}/redfish/v1/$metadata`,
          failOnStatusCode: false,
          headers: { Accept: 'application/xml' }
        }).then((response) => {
          expect(response.body).to.equal(firstBody)
        })
      })
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Method Not Allowed — /redfish/v1/  and  /redfish/v1/odata
// ─────────────────────────────────────────────────────────────────────────────
describe('Redfish Service Root - Method Not Allowed', () => {
  context(
    'TC_SERVICEROOT_METHOD_NOT_ALLOWED - POST PUT PATCH DELETE on /redfish/v1/ return 405 Method Not Allowed',
    () => {
      const methodsNotAllowed = [
        'POST',
        'PUT',
        'DELETE',
        'PATCH'
      ] as const

      methodsNotAllowed.forEach((method) => {
        it(`returns 405 for ${method} /redfish/v1/`, () => {
          cy.request({
            method,
            url: `${redfishUrl()}/redfish/v1/`,
            body: [
              'POST',
              'PUT',
              'PATCH'
            ].includes(method) ? {} : undefined,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.eq(405)
            expect(response.headers['odata-version']).to.not.equal(undefined)
            expect(response.body).to.have.property('error')
          })
        })
      })
    }
  )
})

describe('Redfish OData Service Document - Method Not Allowed', () => {
  context(
    'TC_ODATA_METHOD_NOT_ALLOWED - POST PUT PATCH DELETE on /redfish/v1/odata return 405 Method Not Allowed',
    () => {
      const methodsNotAllowed = [
        'POST',
        'PUT',
        'DELETE',
        'PATCH'
      ] as const

      methodsNotAllowed.forEach((method) => {
        it(`returns 405 for ${method} /redfish/v1/odata`, () => {
          cy.request({
            method,
            url: `${redfishUrl()}/redfish/v1/odata`,
            body: [
              'POST',
              'PUT',
              'PATCH'
            ].includes(method) ? {} : undefined,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.eq(405)
            expect(response.headers['odata-version']).to.not.equal(undefined)
            expect(response.body).to.have.property('error')
          })
        })
      })
    }
  )
})
