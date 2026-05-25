/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Fixtures for Redfish Computer Systems API tests.
 * Covers: GET  /redfish/v1/Systems
 *         GET  /redfish/v1/Systems/{ComputerSystemId}
 *         PATCH /redfish/v1/Systems/{ComputerSystemId}
 *         POST /redfish/v1/Systems/{ComputerSystemId}/Actions/ComputerSystem.Reset
 *
 * testSystemId matches the Postman test environment system_id value.
 * Override at runtime with the REDFISH_SYSTEM_ID Cypress environment variable.
 */

const TEST_SYSTEM_ID = '550e8400-e29b-41d4-a716-446655440001'
const NON_EXISTENT_SYSTEM_ID = '00000000-0000-0000-0000-000000000000'

const systemsFixtures = {
  testSystemId: TEST_SYSTEM_ID,
  nonExistentSystemId: NON_EXISTENT_SYSTEM_ID,

  collection: {
    success: {
      response: {
        '@odata.context': '/redfish/v1/$metadata#ComputerSystemCollection.ComputerSystemCollection',
        '@odata.id': '/redfish/v1/Systems',
        '@odata.type': '#ComputerSystemCollection.ComputerSystemCollection',
        Name: 'Computer System Collection'
      }
    }
  },

  // Valid enum values per DMTF Redfish specification
  validPowerStates: [
    'On',
    'Off',
    'PoweringOn',
    'PoweringOff'
  ],
  validSystemTypes: [
    'Physical',
    'Virtual',
    'OS',
    'PhysicallyPartitioned',
    'VirtuallyPartitioned'
  ],
  validStatusStates: [
    'Enabled',
    'Disabled',
    'StandbyOffline',
    'StandbySpare',
    'InTest',
    'Starting',
    'Absent',
    'UnavailableOffline',
    'Deferring',
    'Quiesced',
    'Updating',
    'Degraded'
  ],
  validHealthValues: [
    'OK',
    'Warning',
    'Critical'
  ],
  validMemoryMirroring: [
    'System',
    'DIMM',
    'Hybrid',
    'None'
  ],

  reset: {
    // All ResetTypes supported by the implementation
    request: { ResetType: 'GracefulShutdown' },
    on: { ResetType: 'On' },
    forceOff: { ResetType: 'ForceOff' },
    forceRestart: { ResetType: 'ForceRestart' },
    gracefulRestart: { ResetType: 'GracefulRestart' },
    powerCycle: { ResetType: 'PowerCycle' },
    // Error cases
    invalidResetType: { ResetType: 'NotARealResetType' },
    missingResetType: {}
  },

  patchBootSettings: {
    // Valid boot settings variants
    request: {
      Boot: { BootSourceOverrideEnabled: 'Once', BootSourceOverrideTarget: 'Pxe' }
    },
    biosSetup: {
      Boot: { BootSourceOverrideEnabled: 'Once', BootSourceOverrideTarget: 'BiosSetup' }
    },
    empty: {},
    // Invalid settings — should return 400
    invalidTarget: {
      Boot: { BootSourceOverrideEnabled: 'Once', BootSourceOverrideTarget: 'InvalidBootTarget' }
    },
    invalidEnabled: {
      Boot: { BootSourceOverrideEnabled: 'Always', BootSourceOverrideTarget: 'Pxe' }
    }
  }
}

export { systemsFixtures }
