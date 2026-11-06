/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Device } from '../../models/models'

export type ConnectionType = 'CIRA' | 'Direct'

// Mirrors Console's server-side rule: a device registered with MPS credentials
// reaches Console over CIRA, anything else is managed directly. Rows that
// predate the connectionType field fall back to the MPS username.
export function connectionTypeOf(
  device: Pick<Device, 'connectionType' | 'mpsusername'> | null | undefined
): ConnectionType | '' {
  if (device == null) return ''
  if (device.connectionType === 'CIRA' || device.connectionType === 'Direct') return device.connectionType
  return device.mpsusername ? 'CIRA' : 'Direct'
}

export function isCIRADevice(device: Pick<Device, 'connectionType' | 'mpsusername'> | null | undefined): boolean {
  return connectionTypeOf(device) === 'CIRA'
}
