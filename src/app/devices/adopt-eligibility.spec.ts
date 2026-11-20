/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { describe, expect, it } from 'vitest'
import { Device } from '../../models/models'
import { adoptEligibility } from './adopt-eligibility'

const device = (management?: Device['management']): Device => ({ guid: 'guid1', management }) as Device

describe('adoptEligibility', () => {
  it('treats an eligible device with no reason as plainly adoptable', () => {
    expect(adoptEligibility(device({ eligible: true }))).toEqual({ eligible: true })
  })

  it('blocks a device that is not activated', () => {
    expect(adoptEligibility(device({ eligible: false, reason: 'notActivated' }))).toEqual({
      eligible: false,
      reasonKey: 'devices.adopt.ineligible.notActivated.value'
    })
  })

  it('blocks a device that does not support vPro or ISM', () => {
    expect(adoptEligibility(device({ eligible: false, reason: 'unsupported' }))).toEqual({
      eligible: false,
      reasonKey: 'devices.adopt.ineligible.unsupported.value'
    })
  })

  it('blocks a device whose capability is unknown, and when Console gave no answer', () => {
    const blocked = { eligible: false, reasonKey: 'devices.adopt.ineligible.unknown.value' }
    expect(adoptEligibility(device({ eligible: false, reason: 'unknown' }))).toEqual(blocked)
    expect(adoptEligibility(device())).toEqual(blocked)
  })

  it('does not trust eligible:true when a reason is attached', () => {
    expect(adoptEligibility(device({ eligible: true, reason: 'notActivated' })).eligible).toBe(false)
  })
})
