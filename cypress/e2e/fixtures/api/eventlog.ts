/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const eventLogs = {
  getAll: {
    success: {
      response: [
        {
          DeviceAddress: 255,
          EventSensorType: 15,
          EventType: 111,
          EventOffset: 2,
          EventSourceType: 104,
          EventSeverity: 8,
          SensorNumber: 255,
          Entity: 34,
          EntityInstance: 0,
          EventData: [
            64,
            19,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          Time: '2021-09-08T16:31:02.000Z',
          EntityStr: 'BIOS',
          Desc: 'Starting operating system boot process'
        }
      ]
    }
  },
  devices: {
    success: {
      response: {
        data: [
          {
            connectionStatus: false,
            guid: 'guid',
            hostname: 'DESKTOP-JF2I0UQ',
            mpsInstance: null,
            mpsusername: 'admin',
            tags: [],
            tenantId: ''
          }
        ],
        totalCount: 1
      }
    }
  },
  version: {
    success: {
      response: {
        CIM_SoftwareIdentity: {
          responses: [
            {},
            {},
            {},
            {
              VersionString: '16.0.8'
            }
          ]
        }
      }
    }
  },
  hardwareInfo: {
    success: {
      response: {
        CIM_Chassis: {
          response: {
            Manufacturer: 'Intel',
            Model: 'AMT',
            SerialNumber: '12',
            Version: '16'
          }
        },
        CIM_BIOSElement: {
          response: {
            Manufacturer: 'Intel',
            Version: '8.8.0.6',
            ReleaseDate: {
              Datetime: 'Jul-4-1776'
            },
            TargetOperatingSystem: 'Win 95'
          }
        },
        CIM_PhysicalMemory: {
          responses: [
            {
              BankLabel: 'BANK 0',
              Capacity: 4294967296,
              CreationClassName: 'CIM_PhysicalMemory',
              ElementName: 'Managed System Memory Chip',
              FormFactor: 13,
              Manufacturer: '04EF',
              MemoryType: 26,
              PartNumber: 'TEAMGROUP-SD4-2133  ',
              SerialNumber: '020300C5',
              Speed: 0,
              Tag: 9876543210
            },
            {
              BankLabel: 'BANK 2',
              Capacity: 4294967296,
              CreationClassName: 'CIM_PhysicalMemory',
              ElementName: 'Managed System Memory Chip',
              FormFactor: 13,
              Manufacturer: '04EF',
              MemoryType: 26,
              PartNumber: 'TEAMGROUP-SD4-2133  ',
              SerialNumber: '020300BD',
              Speed: 0,
              Tag: '9876543210 (#2)'
            }
          ],
          status: 200
        }
      }
    }
  },
  auditlog: {
    success: {
      response: {
        records: [
          {
            Event: 'KVM enabled',
            Time: '2021-09-08T16:31:02.000Z'
          }
        ],
        totalCnt: 1
      }
    }
  },
  alarmOccurrences: {
    success: {
      response: []
    }
  },
  amtFeatures: {
    success: {
      response: {
        userConsent: 'kvm',
        optInState: 0,
        redirection: true,
        KVM: true,
        SOL: true,
        IDER: false
      }
    }
  }
}

export { eventLogs }
