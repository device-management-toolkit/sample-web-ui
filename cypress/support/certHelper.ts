/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Get provisioning certificate based on domain suffix from environment.
 *
 * Uses DOMAIN_SUFFIX environment variable to determine which certificate to return.
 *
 * Priority:
 * 1. PROVISIONING_CERT environment variable (if domain matches)
 * 2. Scan root directory for .base64 files (if domain matches)
 * 3. Return null if no matching certificate found
 *
 * @returns Cypress chainable that resolves to the certificate base64 string or null
 */
export function getProvisioningCertForDomain(): Cypress.Chainable<string | null> {
  const domainSuffix = getDomainSuffix()
  const provisioningCert = Cypress.env('PROVISIONING_CERT')
  const certPassword = Cypress.env('PROVISIONING_CERT_PASSWORD') || ''

  // First check PROVISIONING_CERT env variable
  if (provisioningCert) {
    return cy.task<string>('readCertificateDomain', {
      certBase64: provisioningCert,
      password: certPassword
    }).then((certDomain: string) => {
      // If certificate is invalid/corrupted, certDomain will be empty string
      if (!certDomain) {
        cy.log('[CertHelper] PROVISIONING_CERT is invalid or could not be parsed, scanning .base64 files...')
        return cy.task<string | null>('findCertificateByDomain', {
          domainSuffix,
          password: certPassword
        })
      }

      if (certDomain === domainSuffix || certDomain.endsWith(`.${domainSuffix}`) || domainSuffix.endsWith(`.${certDomain}`)) {
        cy.log(`[CertHelper] PROVISIONING_CERT matches domain: ${domainSuffix}`)
        return cy.wrap(provisioningCert as string | null)
      } else {
        cy.log(`[CertHelper] PROVISIONING_CERT domain (${certDomain}) doesn't match ${domainSuffix}, scanning .base64 files...`)
        // Try scanning .base64 files
        return cy.task<string | null>('findCertificateByDomain', {
          domainSuffix,
          password: certPassword
        })
      }
    })
  }

  // No PROVISIONING_CERT, scan .base64 files
  cy.log('[CertHelper] No PROVISIONING_CERT, scanning .base64 files...')
  return cy.task<string | null>('findCertificateByDomain', {
    domainSuffix,
    password: certPassword
  }).then((foundCert: string | null) => {
    if (foundCert) {
      cy.log(`[CertHelper] Found matching certificate in .base64 file for domain: ${domainSuffix}`)
      return foundCert
    }
    cy.log(`[CertHelper] No matching certificate found for domain: ${domainSuffix}`)
    return null
  })
}

/**
 * Get domain suffix from config with fallback
 * @returns The domain suffix from DOMAIN_SUFFIX env or default 'mlopshub.com'
 */
export function getDomainSuffix(): string {
  return Cypress.env('DOMAIN_SUFFIX') || 'mlopshub.com'
}
