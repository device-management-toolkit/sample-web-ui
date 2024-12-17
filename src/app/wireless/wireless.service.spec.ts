import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { WirelessService } from './wireless.service'
import { AuthService } from '../auth.service'
import { environment } from 'src/environments/environment'
import { WirelessConfig, DataWithCount, PageEventOptions } from 'src/models/models'

describe('WirelessService', () => {
  let service: WirelessService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server' }
  const mockUrl = `${mockEnvironment.rpsServer}/api/v1/admin/wirelessconfigs`

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WirelessService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: environment, useValue: mockEnvironment }]
    })

    service = TestBed.inject(WirelessService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getData', () => {
    it('should call the API with pagination options', () => {
      const pageEvent: PageEventOptions = { pageSize: 10, startsFrom: 0, count: 'true' }
      const mockResponse: DataWithCount<WirelessConfig> = {
        data: [
          {
            profileName: 'wifiConfig1',
            authenticationMethod: 1,
            encryptionMethod: 1,
            ssid: 'testSSID',
            pskPassphrase: 'passphrase'
          }
        ],
        totalCount: 1
      }

      service.getData(pageEvent).subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockUrl}?$top=10&$skip=0&$count=true`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should call the API without pagination options', () => {
      const mockResponse: DataWithCount<WirelessConfig> = {
        data: [
          {
            profileName: 'wifiConfig1',
            authenticationMethod: 1,
            encryptionMethod: 1,
            ssid: 'testSSID',
            pskPassphrase: 'passphrase'
          }
        ],
        totalCount: 1
      }

      service.getData().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockUrl}?$count=true`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.getData().subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}?$count=true`)
      req.flush(null, mockError)
    })
  })

  describe('getRecord', () => {
    it('should call the API with the record name', () => {
      const mockConfig: WirelessConfig = {
        profileName: 'wifiConfig1',
        authenticationMethod: 1,
        encryptionMethod: 1,
        ssid: 'testSSID',
        pskPassphrase: 'passphrase'
      }

      service.getRecord('wifiConfig1').subscribe((response) => {
        expect(response).toEqual(mockConfig)
      })

      const req = httpMock.expectOne(`${mockUrl}/wifiConfig1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockConfig)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.getRecord('wifiConfig1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/wifiConfig1`)
      req.flush(null, mockError)
    })
  })

  describe('create', () => {
    it('should call the API to create a new config', () => {
      const mockConfig: WirelessConfig = {
        profileName: 'wifiConfig1',
        authenticationMethod: 1,
        encryptionMethod: 1,
        ssid: 'testSSID',
        pskPassphrase: 'passphrase'
      }

      service.create(mockConfig).subscribe((response) => {
        expect(response).toEqual(mockConfig)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('POST')
      req.flush(mockConfig)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service
        .create({ profileName: 'wifiConfig1', authenticationMethod: 1, encryptionMethod: 1, ssid: 'testSSID' })
        .subscribe({
          error: (error) => {
            expect(error).toEqual(['Error occurred'])
          }
        })

      const req = httpMock.expectOne(mockUrl)
      req.flush(null, mockError)
    })
  })

  describe('update', () => {
    it('should call the API to update a config', () => {
      const mockConfig: WirelessConfig = {
        profileName: 'wifiConfig1',
        authenticationMethod: 1,
        encryptionMethod: 1,
        ssid: 'testSSID',
        pskPassphrase: 'passphrase'
      }

      service.update(mockConfig).subscribe((response) => {
        expect(response).toEqual(mockConfig)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('PATCH')
      req.flush(mockConfig)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service
        .update({ profileName: 'wifiConfig1', authenticationMethod: 1, encryptionMethod: 1, ssid: 'testSSID' })
        .subscribe({
          error: (error) => {
            expect(error).toEqual(['Error occurred'])
          }
        })

      const req = httpMock.expectOne(mockUrl)
      req.flush(null, mockError)
    })
  })

  describe('delete', () => {
    it('should call the API to delete a config', () => {
      service.delete('wifiConfig1').subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockUrl}/wifiConfig1`)
      expect(req.request.method).toBe('DELETE')
      req.flush({})
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.delete('wifiConfig1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/wifiConfig1`)
      req.flush(null, mockError)
    })
  })
})
