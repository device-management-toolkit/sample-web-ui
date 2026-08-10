/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Capability keys used by the Remote Platform Erase UI.
 * (If the backend exposes these as a bitmask, convert at the service/component boundary.)
 * Reference: https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/
 *   default.htm?turl=HTMLDocuments%2FWS-Management_Class_Reference%2FAMT_BootCapabilities.htm%23PlatformErase
 */
export interface PlatformEraseCapability {
  key: string
}

export const PLATFORM_ERASE_CAPABILITIES: PlatformEraseCapability[] = [
  { key: 'secureEraseSsds' },
  { key: 'tpmClear' },
  { key: 'biosRestore' },
  { key: 'csmeUnconfigure' }
]

export interface ParsedPlatformEraseCapability {
  key: string
  supported: boolean
}
