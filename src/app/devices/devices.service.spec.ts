import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { DevicesService } from './devices.service'
import { environment } from 'src/environments/environment'
import {
  AMTFeaturesResponse,
  DataWithCount,
  Device,
  PowerState,
  DeviceStats,
  RedirectionToken,
  RedirectionStatus,
  UserConsentResponse,
  DiskInformation,
  IPSAlarmClockOccurrence,
  IPSAlarmClockOccurrenceInput
} from 'src/models/models'

describe('DevicesService', () => {
  let service: DevicesService
  let httpMock: HttpTestingController

  const mockEnvironment = { mpsServer: 'https://test-mps', rpsServer: 'https://test-rps' }

  beforeEach(() => {
    environment.mpsServer = mockEnvironment.mpsServer
    environment.rpsServer = mockEnvironment.rpsServer

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DevicesService, { provide: environment, useValue: mockEnvironment }]
    })

    service = TestBed.inject(DevicesService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getDiskInformation', () => {
    it('should fetch disk information for a device', () => {
      const mockResponse: DiskInformation = { CIM_MediaAccessDevice: [], CIM_PhysicalPackage: [] } as any

      service.getDiskInformation('device1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/diskInfo/device1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getDiskInformation('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/diskInfo/device1`)
      req.flush(null, mockError)
    })
  })

  describe('getAMTFeatures', () => {
    it('should fetch AMT features for a device', () => {
      const mockResponse: AMTFeaturesResponse = {
        userConsent: 'none',
        optInState: 0,
        redirection: true,
        KVM: true,
        SOL: true,
        IDER: true
      }

      service.getAMTFeatures('device1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/features/device1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getAMTFeatures('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/features/device1`)
      req.flush(null, mockError)
    })
  })

  describe('getAlarmOccurrences', () => {
    it('should fetch alarm occurrences for a device', () => {
      const mockResponse: IPSAlarmClockOccurrence[] = []

      service.getAlarmOccurrences('device1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/alarmOccurrences/device1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getAlarmOccurrences('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/alarmOccurrences/device1`)
      req.flush(null, mockError)
    })
  })

  describe('deleteAlarmOccurrence', () => {
    it('should delete an alarm occurrence for a device', () => {
      const instanceID = 'alarm1'

      service.deleteAlarmOccurrence('device1', instanceID).subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/alarmOccurrences/device1`)
      expect(req.request.method).toBe('DELETE')
      expect(req.request.body).toEqual({ Name: instanceID })
      req.flush({})
    })

    it('should handle errors', () => {
      const instanceID = 'alarm1'
      const mockError = { status: 404, statusText: 'Not Found' }

      service.deleteAlarmOccurrence('device1', instanceID).subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/alarmOccurrences/device1`)
      req.flush(null, mockError)
    })
  })

  describe('addAlarmOccurrence', () => {
    it('should add an alarm occurrence for a device', () => {
      const mockRequest: IPSAlarmClockOccurrenceInput = {
        ElementName: 'TestAlarm',
        InstanceID: 'alarm1',
        StartTime: '2024-01-01T00:00:00Z',
        DeleteOnCompletion: true
      }

      service.addAlarmOccurrence('device1', mockRequest).subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/alarmOccurrences/device1`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(mockRequest)
      req.flush({})
    })

    it('should handle errors', () => {
      const mockRequest: IPSAlarmClockOccurrenceInput = {
        ElementName: 'TestAlarm',
        InstanceID: 'alarm1',
        StartTime: '2024-01-01T00:00:00Z',
        DeleteOnCompletion: true
      }
      const mockError = { status: 400, statusText: 'Bad Request' }

      service.addAlarmOccurrence('device1', mockRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(400)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/alarmOccurrences/device1`)
      req.flush(null, mockError)
    })
  })

  describe('sendPowerAction', () => {
    it('should send a power action for a device', () => {
      const action = 2
      const useSOL = true
      const mockPayload = { method: 'PowerAction', action, useSOL }

      service.sendPowerAction('device1', action, useSOL).subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/power/action/device1`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(mockPayload)
      req.flush({})
    })

    it('should send a boot options action for a device if action >= 100', () => {
      const action = 100
      const useSOL = false
      const mockPayload = { method: 'PowerAction', action, useSOL }

      service.sendPowerAction('device1', action, useSOL).subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/power/bootoptions/device1`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(mockPayload)
      req.flush({})
    })

    it('should handle errors', () => {
      const action = 2
      const useSOL = true
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.sendPowerAction('device1', action, useSOL).subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/power/action/device1`)
      req.flush(null, mockError)
    })
  })
  describe('sendDeactivate', () => {
    it('should deactivate a device in cloud mode', () => {
      const guid = 'device1'
      environment.cloud = true

      service.sendDeactivate(guid).subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/deactivate/${guid}`)
      expect(req.request.method).toBe('DELETE')
      req.flush({})
    })

    it('should deactivate a device in non-cloud mode', () => {
      const guid = 'device1'
      environment.cloud = false

      service.sendDeactivate(guid).subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/${guid}`)
      expect(req.request.method).toBe('DELETE')
      req.flush({})
    })

    it('should handle errors', () => {
      const guid = 'device1'
      environment.cloud = true
      const mockError = { status: 404, statusText: 'Not Found' }

      service.sendDeactivate(guid).subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/deactivate/${guid}`)
      req.flush(null, mockError)
    })
  })

  describe('getTags', () => {
    it('should fetch tags for devices', () => {
      const mockResponse = ['tag1', 'tag2']

      service.getTags().subscribe((response) => {
        expect(response).toEqual(['tag1', 'tag2'])
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/tags`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getTags().subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/tags`)
      req.flush(null, mockError)
    })
  })

  describe('addDevice', () => {
    it('should add a new device', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any

      service.addDevice(mockDevice).subscribe((response) => {
        expect(response).toEqual(mockDevice)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(mockDevice)
      req.flush(mockDevice)
    })

    it('should handle errors', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.addDevice(mockDevice).subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices`)
      req.flush(null, mockError)
    })
  })

  describe('editDevice', () => {
    it('should edit an existing device', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any

      service.editDevice(mockDevice).subscribe((response) => {
        expect(response).toEqual(mockDevice)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices`)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual(mockDevice)
      req.flush(mockDevice)
    })

    it('should handle errors', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.editDevice(mockDevice).subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices`)
      req.flush(null, mockError)
    })
  })

  describe('getDevice', () => {
    it('should fetch a specific device by GUID', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any

      service.getDevice('guid1').subscribe((response) => {
        expect(response).toEqual(mockDevice)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockDevice)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getDevice('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('getDevices', () => {
    it('should fetch a list of devices', () => {
      const mockDevices: DataWithCount<Device> = {
        data: [{ hostname: 'device1', guid: 'guid1', connectionStatus: true }] as any,
        totalCount: 1
      }

      service.getDevices({ pageSize: 10, startsFrom: 0, count: 'true' }).subscribe((response) => {
        expect(response).toEqual(mockDevices)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices?$top=10&$skip=0&$count=true`)
      expect(req.request.method).toBe('GET')
      req.flush(mockDevices)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.getDevices({ pageSize: 10, startsFrom: 0, count: 'true' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices?$top=10&$skip=0&$count=true`)
      req.flush(null, mockError)
    })
  })

  describe('updateDevice', () => {
    it('should update a device', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any

      service.updateDevice(mockDevice).subscribe((response) => {
        expect(response).toEqual(mockDevice)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices`)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual(mockDevice)
      req.flush(mockDevice)
    })

    it('should handle errors', () => {
      const mockDevice: Device = { hostname: 'device1', guid: 'guid1', connectionStatus: true } as any
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.updateDevice(mockDevice).subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices`)
      req.flush(null, mockError)
    })
  })
  describe('setAmtFeatures', () => {
    it('should set AMT features', () => {
      const mockResponse: AMTFeaturesResponse = {
        redirection: true,
        KVM: true,
        SOL: true,
        IDER: true,
        userConsent: 'all',
        optInState: 1
      }
      const payload = { userConsent: 'none', enableKVM: true, enableSOL: true, enableIDER: true }

      service.setAmtFeatures('device1', payload).subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/features/device1`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(payload)
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }

      service.setAmtFeatures('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(400)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/features/device1`)
      req.flush(null, mockError)
    })
  })

  describe('getPowerState', () => {
    it('should fetch power state for a device', () => {
      const mockResponse: PowerState = { powerstate: 2 }

      service.getPowerState('device1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/power/state/device1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getPowerState('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/power/state/device1`)
      req.flush(null, mockError)
    })
  })

  describe('getStats', () => {
    it('should fetch device statistics', () => {
      const mockResponse: DeviceStats = { totalCount: 100, connectedCount: 80, disconnectedCount: 20 }

      service.getStats().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.getStats().subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)
      req.flush(null, mockError)
    })
  })

  describe('reqUserConsentCode', () => {
    it('should request user consent code', () => {
      const mockResponse: UserConsentResponse = {
        Header: {},
        Body: { ReturnValue: 0, ReturnValueStr: 'Success' }
      } as any

      service.reqUserConsentCode('device1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/userConsentCode/device1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.reqUserConsentCode('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/userConsentCode/device1`)
      req.flush(null, mockError)
    })
  })

  describe('cancelUserConsentCode', () => {
    it('should cancel user consent code', () => {
      const mockResponse: UserConsentResponse = {
        Header: {},
        Body: { ReturnValue: 0, ReturnValueStr: 'Cancelled' }
      } as any

      service.cancelUserConsentCode('device1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/userConsentCode/cancel/device1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.cancelUserConsentCode('device1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/userConsentCode/cancel/device1`)
      req.flush(null, mockError)
    })
  })

  describe('sendUserConsentCode', () => {
    it('should send user consent code', () => {
      const mockResponse: UserConsentResponse = {
        Header: {},
        Body: { ReturnValue: 0, ReturnValueStr: 'Accepted' }
      } as any
      const payload = { consentCode: 1234 }

      service.sendUserConsentCode('device1', 1234).subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/userConsentCode/device1`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(payload)
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }

      service.sendUserConsentCode('device1', 1234).subscribe({
        error: (error) => {
          expect(error.status).toBe(400)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/userConsentCode/device1`)
      req.flush(null, mockError)
    })
  })

  describe('getRedirectionExpirationToken', () => {
    it('should fetch redirection expiration token', () => {
      const mockResponse: RedirectionToken = { token: 'abcd1234' }

      service.getRedirectionExpirationToken('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/redirection/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getRedirectionExpirationToken('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/redirection/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('getRedirectionStatus', () => {
    it('should fetch redirection status', () => {
      const mockResponse: RedirectionStatus = { isKVMConnected: true, isSOLConnected: false, isIDERConnected: false }

      service.getRedirectionStatus('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/redirectstatus/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.getRedirectionStatus('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/redirectstatus/guid1`)
      req.flush(null, mockError)
    })
  })
  describe('getWsmanOperations', () => {
    it('should fetch WSMAN operations', () => {
      const mockResponse = ['Operation1', 'Operation2']

      service.getWsmanOperations().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/explorer`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.getWsmanOperations().subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/explorer`)
      req.flush(null, mockError)
    })
  })

  describe('executeExplorerCall', () => {
    it('should execute a WSMAN operation', () => {
      const mockResponse = { success: true }

      service.executeExplorerCall('guid1', 'Operation1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/explorer/guid1/Operation1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.executeExplorerCall('guid1', 'Operation1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/explorer/guid1/Operation1`)
      req.flush(null, mockError)
    })
  })

  describe('getCertificates', () => {
    it('should fetch certificates for a device', () => {
      const mockResponse = [{ certificate: 'cert1' }, { certificate: 'cert2' }]

      service.getCertificates('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/certificates/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.getCertificates('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/certificates/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('getNetworkSettings', () => {
    it('should fetch network settings for a device', () => {
      const mockResponse = { ip: '192.168.0.1' }

      service.getNetworkSettings('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/networkSettings/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getNetworkSettings('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/networkSettings/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('getTLSSettings', () => {
    it('should fetch TLS settings for a device', () => {
      const mockResponse = { tlsEnabled: true }

      service.getTLSSettings('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/tls/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.getTLSSettings('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/amt/tls/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('getDeviceCertificate', () => {
    it('should fetch device certificate', () => {
      const mockResponse = { certificate: 'device-cert' }

      service.getDeviceCertificate('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/cert/guid1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getDeviceCertificate('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/cert/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('pinDeviceCertificate', () => {
    it('should pin a device certificate', () => {
      const mockResponse = { success: true }
      const payload = { sha256Fingerprint: 'fingerprint123' }

      service.pinDeviceCertificate('guid1', 'fingerprint123').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/cert/guid1`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual(payload)
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }

      service.pinDeviceCertificate('guid1', 'fingerprint123').subscribe({
        error: (error) => {
          expect(error.status).toBe(400)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/cert/guid1`)
      req.flush(null, mockError)
    })
  })

  describe('deleteDeviceCertificate', () => {
    it('should delete a device certificate', () => {
      const mockResponse = { success: true }

      service.deleteDeviceCertificate('guid1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/cert/guid1`)
      expect(req.request.method).toBe('DELETE')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.deleteDeviceCertificate('guid1').subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/cert/guid1`)
      req.flush(null, mockError)
    })
  })
})
