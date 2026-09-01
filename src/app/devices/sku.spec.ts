/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { describe, expect, it } from 'vitest'
import { getSkuFromAmtVersion, isISMSku, skuLabel, SKU_AMT, SKU_ISM } from './sku'

describe('sku helpers', () => {
  describe('getSkuFromAmtVersion', () => {
    it('finds the Sku entry by InstanceID and returns its VersionString', () => {
      const responses = [
        { InstanceID: 'AMT', VersionString: '16.1.25.2197' },
        { InstanceID: 'Sku', VersionString: '16400' }
      ]
      expect(getSkuFromAmtVersion(responses)).toBe('16400')
    })

    it('coerces a numeric VersionString to a string', () => {
      const responses = [{ InstanceID: 'Sku', VersionString: 16400 }]
      expect(getSkuFromAmtVersion(responses)).toBe('16400')
      expect(typeof getSkuFromAmtVersion(responses)).toBe('string')
    })

    it('returns empty string when no Sku entry is present', () => {
      const responses = [{ InstanceID: 'AMT', VersionString: '16.1' }]
      expect(getSkuFromAmtVersion(responses)).toBe('')
    })

    it('returns empty string for an empty array', () => {
      expect(getSkuFromAmtVersion([])).toBe('')
    })

    it('returns empty string for null or non-array input', () => {
      expect(getSkuFromAmtVersion(null as any)).toBe('')
      expect(getSkuFromAmtVersion(undefined as any)).toBe('')
      expect(getSkuFromAmtVersion({} as any)).toBe('')
    })

    it('returns empty string when Sku entry exists but VersionString is missing', () => {
      const responses = [{ InstanceID: 'Sku' }]
      expect(getSkuFromAmtVersion(responses)).toBe('')
    })
  })

  describe('isISMSku', () => {
    it('returns true for the ISM SKU constant', () => {
      expect(isISMSku(SKU_ISM)).toBe(true)
    })

    it('returns false for the AMT SKU constant', () => {
      expect(isISMSku(SKU_AMT)).toBe(false)
    })

    it('returns false for an unknown SKU', () => {
      expect(isISMSku('99999')).toBe(false)
    })
  })

  describe('skuLabel', () => {
    it('returns the ISM display name for the ISM SKU', () => {
      expect(skuLabel(SKU_ISM)).toBe('Intel® Standard Manageability')
    })

    it('returns the AMT display name for the AMT SKU', () => {
      expect(skuLabel(SKU_AMT)).toBe('Intel® Active Management Technology')
    })

    it('returns the raw SKU string for unknown values', () => {
      expect(skuLabel('99999')).toBe('99999')
    })
  })
})
