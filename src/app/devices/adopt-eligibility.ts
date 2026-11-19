/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Device } from '../../models/models'

export interface AdoptEligibility {
  eligible: boolean
  // Translation key saying why the device cannot be adopted.
  reasonKey?: string
}

// Console decides, and Adopt is offered only for a device that supports ISM or vPro and is
// activated. Anything else is blocked with the reason: a device that cannot be managed (not
// activated, no AMT capability reported, or no answer from Console) must not invite an Adopt
// that can only fail.
export function adoptEligibility(device: Device): AdoptEligibility {
  const management = device.management
  if (management?.eligible && !management.reason) return { eligible: true }
  switch (management?.reason) {
    case 'unsupported':
      return { eligible: false, reasonKey: 'devices.manage.ineligible.unsupported.value' }
    case 'notActivated':
      return { eligible: false, reasonKey: 'devices.manage.ineligible.notActivated.value' }
    default:
      return { eligible: false, reasonKey: 'devices.manage.ineligible.unknown.value' }
  }
}
