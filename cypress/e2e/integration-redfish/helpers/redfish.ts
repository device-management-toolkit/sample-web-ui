/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Shared Redfish Cypress helpers for URL/auth and dynamic system selection.
 */

export const redfishUrl = (): string => Cypress.env('REDFISH_BASEURL') ?? 'http://localhost:8181'

export const basicAuthHeaders = (): Record<string, string> => {
  const username = (Cypress.env('REDFISH_USERNAME') as string) ?? 'standalone'
  const password = (Cypress.env('REDFISH_PASSWORD') as string) ?? 'G@ppm0ym'
  return { Authorization: `Basic ${btoa(`${username}:${password}`)}` }
}

const normalizedIsolationSwitch = (): string | undefined => {
  const raw = Cypress.env('ISOLATE')

  if (typeof raw === 'boolean') {
    return raw ? 'Y' : 'N'
  }

  if (typeof raw !== 'string') {
    return undefined
  }

  const normalized = raw.trim().toUpperCase()
  return normalized.length > 0 ? normalized : undefined
}

export const isIsolatedRun = (): boolean => normalizedIsolationSwitch() !== 'N'

export const deviceAllowedStatuses = (
  successStatuses: number | number[],
  isolatedOnlyStatuses: number[] = []
): number[] => {
  const normalizedSuccessStatuses = Array.isArray(successStatuses) ? successStatuses : [successStatuses]

  return isIsolatedRun()
    ? Array.from(new Set([...normalizedSuccessStatuses, ...isolatedOnlyStatuses]))
    : normalizedSuccessStatuses
}

const configuredSystemId = (): string | undefined => {
  const raw = Cypress.env('REDFISH_SYSTEM_ID')
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const extractSystemIdFromODataId = (odataId: string): string | undefined => {
  const match = odataId.match(/\/redfish\/v1\/Systems\/([^/]+)$/)
  return match?.[1]
}

/**
 * Returns a `systemId()` getter backed by a `before()` hook:
 * - If `REDFISH_SYSTEM_ID` is set, use it.
 * - Otherwise call `/redfish/v1/Systems` and auto-select the first member.
 * - Falls back to `fallbackSystemId` if discovery fails.
 */
export const createSystemIdResolver = (fallbackSystemId: string): (() => string) => {
  let resolvedSystemId: string | undefined

  before(() => {
    const isolatedRun = isIsolatedRun()
    const configured = configuredSystemId()
    if (configured) {
      resolvedSystemId = configured
      cy.log(`Using REDFISH_SYSTEM_ID from environment: ${configured}`)
      return
    }

    cy.request({
      method: 'GET',
      url: `${redfishUrl()}/redfish/v1/Systems`,
      headers: basicAuthHeaders(),
      failOnStatusCode: false
    }).then((response) => {
      if (response.status !== 200) {
        if (!isolatedRun) {
          throw new Error(
            `Non-isolated run requires GET /redfish/v1/Systems to return 200, received HTTP ${response.status}`
          )
        }

        resolvedSystemId = fallbackSystemId
        cy.log(`System discovery failed (HTTP ${response.status}), fallback ID: ${resolvedSystemId}`)
        return
      }

      const body = response.body as { Members?: { '@odata.id'?: string }[] }
      const members = Array.isArray(body.Members) ? body.Members : []
      const firstODataId = members.find((member) => typeof member?.['@odata.id'] === 'string')?.['@odata.id']
      const discovered = typeof firstODataId === 'string' ? extractSystemIdFromODataId(firstODataId) : undefined

      if (!discovered) {
        if (!isolatedRun) {
          throw new Error('Non-isolated run requires at least one system member under /redfish/v1/Systems')
        }

        resolvedSystemId = fallbackSystemId
        cy.log(`System discovery returned no members, fallback ID: ${resolvedSystemId}`)
        return
      }

      resolvedSystemId = discovered
      cy.log(`Auto-selected REDFISH_SYSTEM_ID: ${resolvedSystemId}`)
    })
  })

  return (): string => resolvedSystemId ?? fallbackSystemId
}
