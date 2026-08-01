/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const SKU_ISM = '16400'
export const SKU_AMT = '16392'

/**
 * Extracts the SKU string from a CIM_SoftwareIdentity responses array by
 * looking up the entry whose InstanceID is 'Sku', matching the pattern used
 * elsewhere in the codebase (e.g. version-fetcher.js InstanceID === 'AMT').
 * String() coercion handles the case where the server returns a numeric value.
 */
export function getSkuFromAmtVersion(responses: any[]): string {
  if (!Array.isArray(responses)) {
    return ''
  }
  const entry = responses.find((e) => e?.InstanceID === 'Sku')
  return entry?.VersionString != null ? String(entry.VersionString) : ''
}

export function isISMSku(sku: string): boolean {
  return sku === SKU_ISM
}

export function skuLabel(sku: string): string {
  switch (sku) {
    case SKU_ISM:
      return 'Intel® Standard Manageability'
    case SKU_AMT:
      return 'Intel® Active Management Technology'
    default:
      return sku
  }
}
