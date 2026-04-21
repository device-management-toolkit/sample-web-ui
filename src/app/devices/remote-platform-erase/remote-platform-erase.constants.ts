/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Bitmask definitions for AMT_BootCapabilities.PlatformErase.
 * Capabilities vary by AMT/CSME version.
 * Reference: https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/
 *   default.htm?turl=HTMLDocuments%2FWS-Management_Class_Reference%2FAMT_BootCapabilities.htm%23PlatformErase
 */
export interface PlatformEraseCapability {
  bit: number
  key: string
}

export const PLATFORM_ERASE_CAPABILITIES: PlatformEraseCapability[] = [
  { bit: 0x04, key: 'secureEraseSsds' },
  { bit: 0x40, key: 'tpmClear' },
  { bit: 0x4000000, key: 'biosRestore' },
  { bit: 0x10000, key: 'csmeUnconfigure' }
]

export interface ParsedPlatformEraseCapability {
  key: string
  supported: boolean
}

export function parsePlatformEraseCaps(bitmask: number): ParsedPlatformEraseCapability[] {
  return PLATFORM_ERASE_CAPABILITIES.map((cap) => ({
    key: cap.key,
    supported: (bitmask & cap.bit) !== 0
  }))
}
