/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { httpCodes } from '../../fixtures/api/httpCodes'
import { downloadRpc } from '../../fixtures/api/downloadRpc'
import { RpcRelease } from '../../../../src/models/models'
import { Domain } from '../../../../src/models/models'
import { Profile } from '../../../../src/app/profiles/profiles.constants'

// The Download RPC page only exists in the Console (enterprise) build.
const describeWhenNotCloud = Cypress.expose('CLOUD') ? describe.skip : describe

const osLabels: Record<string, string> = { windows: 'Windows', linux: 'Linux', both: 'Windows and Linux' }

// Mirrors the page: an OS is offered only when the release has an x64 build for it.
const expectedOses = (release: RpcRelease): string[] => {
  const hasBuild = (os: string): boolean => release.assets.some((a) => a.os === os && a.arch === 'x64')
  return [
    'windows',
    'linux',
    'both'
  ].filter((os) => (os === 'both' ? hasBuild('windows') && hasBuild('linux') : hasBuild(os)))
}

describeWhenNotCloud('Download RPC', () => {
  let releases: RpcRelease[]
  let profiles: Profile[]
  let domains: Domain[]

  beforeEach('Setup and login', () => {
    cy.setup()
  })

  beforeEach('Setup intercepts and open the page', () => {
    cy.myIntercept('GET', /api\/package\/rpc-versions$/, {
      statusCode: httpCodes.SUCCESS,
      body: downloadRpc.versions.success.response
    }).as('get-versions')

    cy.myIntercept('GET', /admin\/profiles\?\$count=true$/, {
      statusCode: httpCodes.SUCCESS,
      body: downloadRpc.profiles.success.response
    }).as('get-profiles')

    cy.myIntercept('GET', /admin\/domains\?\$count=true$/, {
      statusCode: httpCodes.SUCCESS,
      body: downloadRpc.domains.success.response
    }).as('get-domains')

    cy.myIntercept('POST', /api\/package$/, {
      statusCode: httpCodes.SUCCESS,
      headers: { 'content-type': 'application/zip' },
      body: 'PK'
    }).as('post-package')

    cy.goToPage('Download RPC')

    cy.wait('@get-versions').then(({ response }) => {
      expect(response?.statusCode).to.eq(httpCodes.SUCCESS)
      releases = response?.body
      expect(releases, 'rpc-go releases').to.have.length.greaterThan(0)
    })
    cy.wait('@get-profiles').then(({ response }) => {
      expect(response?.statusCode).to.eq(httpCodes.SUCCESS)
      profiles = response?.body.data
      expect(profiles, 'profiles').to.have.length.greaterThan(0)
    })
    cy.wait('@get-domains').then(({ response }) => {
      expect(response?.statusCode).to.eq(httpCodes.SUCCESS)
      domains = response?.body.data
    })
  })

  it('shows the preview chip and defaults to the newest version and first profile', () => {
    cy.get('[data-cy="previewChip"]').should('contain.text', 'Preview Feature')
    cy.get('[data-cy="intro"]').should('be.visible')
    cy.then(() => {
      cy.matSelectAssert('[data-cy="version"]', releases[0].version)
      cy.matSelectAssert('[data-cy="os"]', osLabels[expectedOses(releases[0])[0]])
      cy.matSelectAssert('[data-cy="profile"]', profiles[0].profileName)
    })
  })

  it('offers only the operating systems with an x64 build', () => {
    cy.then(() => {
      releases.forEach((release) => {
        cy.matSelectChoose('[data-cy="version"]', release.version)
        cy.get('mat-select[data-cy="os"]').click()
        cy.get('mat-option').should('have.length', expectedOses(release).length)
        expectedOses(release).forEach((os) => cy.get('mat-option').should('contain.text', osLabels[os]))
        cy.get('body').type('{esc}')
      })
    })
  })

  it('requires a domain for an ACM profile', function () {
    const acm = profiles.find((p) => p.activation === 'acmactivate')
    if (acm == null) {
      this.skip()
    }
    cy.matSelectChoose('[data-cy="profile"]', acm!.profileName)
    cy.get('[data-cy="download"]').should('be.disabled')
    cy.get('mat-select[data-cy="domain"]').click()
    cy.get('mat-option').first().click()
    cy.get('[data-cy="download"]').should('be.enabled')
  })

  it('warns when the server URL is loopback', () => {
    cy.matTextlikeInputType('[data-cy="serverUrl"]', 'https://localhost:8181')
    cy.get('[data-cy="serverUrlLocalWarning"]').should('be.visible')
    cy.matTextlikeInputType('[data-cy="serverUrl"]', 'https://console.corp.example.com')
    cy.get('[data-cy="serverUrlLocalWarning"]').should('not.exist')
  })

  it('builds a token-authenticated package for every offered operating system', () => {
    cy.then(() => {
      const profile = profiles[0]
      const isAcm = profile.activation === 'acmactivate'
      if (isAcm) {
        expect(domains, 'domains for an ACM profile').to.have.length.greaterThan(0)
        cy.matSelectChoose('[data-cy="domain"]', domains[0].profileName)
      }
      cy.matTextlikeInputType('[data-cy="serverUrl"]', 'https://console.corp.example.com')
      cy.matRadioButtonChoose('[data-cy="authMode"]', 'token')
      cy.get('[data-cy="noCredentialsNote"]').should('not.exist')
      cy.matSelectChoose('[data-cy="tokenTtl"]', '8 hours')

      expectedOses(releases[0]).forEach((os) => {
        cy.matSelectChoose('[data-cy="os"]', osLabels[os])
        cy.get('[data-cy="download"]').click()
        // A live Console fetches and verifies rpc-go from GitHub before zipping.
        cy.wait('@post-package', { responseTimeout: 120000 }).then(({ request, response }) => {
          expect(request.body).to.deep.equal({
            command: 'activate',
            version: releases[0].version,
            os,
            arch: 'x64',
            serverUrl: 'https://console.corp.example.com',
            auth: { mode: 'token' },
            tokenTtl: '8h',
            profile: profile.profileName,
            ...(isAcm ? { domain: domains[0].profileName } : {})
          })
          expect(response?.statusCode).to.eq(httpCodes.SUCCESS)
          expect(response?.headers['content-type']).to.contain('application/zip')
        })
        cy.get('[data-cy="download"]').should('be.enabled')
      })
    })
  })
})
