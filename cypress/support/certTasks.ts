/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as forge from 'node-forge'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Read certificate domain from a PFX certificate
 * @param certBase64 - Base64 encoded PFX certificate
 * @param password - Certificate password
 * @returns Domain suffix extracted from certificate CN or SANs
 */
export function readCertificateDomain({ certBase64, password }: { certBase64: string, password: string }): string {
  try {
    const certBuffer = Buffer.from(certBase64, 'base64')
    const p12Der = forge.util.decode64(certBuffer.toString('base64'))
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

    // Get certificate from PKCS#12
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]?.[0]

    if (certBag?.cert) {
      const cert = certBag.cert

      // Try to get domain from Subject Alternative Names (SANs) first
      const sanExtension = cert.extensions?.find((ext: any) => ext.name === 'subjectAltName')
      if (sanExtension?.altNames) {
        for (const altName of sanExtension.altNames) {
          if (altName.type === 2) { // type 2 = dNSName
            return altName.value
          }
        }
      }

      // Fallback to CN from subject
      const cnAttr = cert.subject.getField('CN')
      if (cnAttr) {
        return cnAttr.value
      }
    }

    return ''
  } catch (error) {
    // Silently skip invalid certificates or wrong passwords
    return ''
  }
}

/**
 * Find a certificate file by domain suffix
 * @param domainSuffix - Domain suffix to match
 * @param password - Certificate password
 * @returns Base64 encoded certificate data if found, null otherwise
 */
export function findCertificateByDomain({ domainSuffix, password }: { domainSuffix: string, password: string }): string | null {
  try {
    // Scan root directory for .base64 files
    const rootDir = path.resolve(__dirname, '../..')
    const files = fs.readdirSync(rootDir)
    const certFiles = files.filter(file => file.endsWith('.base64'))

    for (const certFile of certFiles) {
      try {
        const certPath = path.join(rootDir, certFile)
        const certBase64 = fs.readFileSync(certPath, 'utf-8').trim()

        // Extract domain from this certificate
        const certDomain = readCertificateDomain({ certBase64, password })

        if (certDomain) {
          // Check if domains match (exact or subdomain)
          if (certDomain === domainSuffix ||
              certDomain.endsWith(`.${domainSuffix}`) ||
              domainSuffix.endsWith(`.${certDomain}`)) {
            console.log(`[CertTasks] ✓ Using certificate: ${certFile} for domain: ${domainSuffix}`)
            return certBase64
          }
        }
      } catch (error) {
        // Silently skip invalid certificates
        continue
      }
    }

    console.log(`[CertTasks] ✗ No matching certificate found for domain: ${domainSuffix}`)
    return null
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`[CertTasks] Error scanning certificate directory: ${errorMsg}`)
    return null
  }
}
