import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { ConfigsService } from './configs.service'
import { AuthService } from '../auth.service'
import { environment } from 'src/environments/environment'
import { CIRAConfig, DataWithCount, PageEventOptions } from 'src/models/models'

describe('ConfigsService', () => {
  let service: ConfigsService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server', mpsServer: 'https://mps-server' }
  const mockUrl = `${mockEnvironment.rpsServer}/api/v1/admin/ciraconfigs`

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = mockEnvironment.rpsServer
    environment.mpsServer = mockEnvironment.mpsServer
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConfigsService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: environment, useValue: mockEnvironment }]
    })

    service = TestBed.inject(ConfigsService)
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
      const mockResponse: DataWithCount<CIRAConfig> = {
        data: [
          {
            configName: 'config1',
            mpsServerAddress: 'address',
            mpsPort: 443,
            username: 'user',
            password: 'pass',
            commonName: 'common',
            serverAddressFormat: 0,
            authMethod: 1,
            mpsRootCertificate: 'cert',
            proxyDetails: 'proxy'
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
      const mockResponse: DataWithCount<CIRAConfig> = {
        data: [
          {
            configName: 'config1',
            mpsServerAddress: 'address',
            mpsPort: 443,
            username: 'user',
            password: 'pass',
            commonName: 'common',
            serverAddressFormat: 0,
            authMethod: 1,
            mpsRootCertificate: 'cert',
            proxyDetails: 'proxy'
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
      const mockConfig: CIRAConfig = {
        configName: 'config1',
        mpsServerAddress: 'address',
        mpsPort: 443,
        username: 'user',
        password: 'pass',
        commonName: 'common',
        serverAddressFormat: 0,
        authMethod: 1,
        mpsRootCertificate: 'cert',
        proxyDetails: 'proxy'
      }

      service.getRecord('config1').subscribe((response) => {
        expect(response).toEqual(mockConfig)
      })

      const req = httpMock.expectOne(`${mockUrl}/config1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockConfig)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.getRecord('config1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/config1`)
      req.flush(null, mockError)
    })
  })

  describe('create', () => {
    it('should call the API to create a new config', () => {
      const mockConfig: CIRAConfig = {
        configName: 'config1',
        mpsServerAddress: 'address',
        mpsPort: 443,
        username: 'user',
        password: 'pass',
        commonName: 'common',
        serverAddressFormat: 0,
        authMethod: 1,
        mpsRootCertificate: 'cert',
        proxyDetails: 'proxy'
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
        .create({
          configName: 'config1',
          mpsServerAddress: 'address',
          mpsPort: 443,
          username: 'user',
          password: 'pass',
          commonName: 'common',
          serverAddressFormat: 0,
          authMethod: 1,
          mpsRootCertificate: 'cert',
          proxyDetails: 'proxy'
        })
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
      const mockConfig: CIRAConfig = {
        configName: 'config1',
        mpsServerAddress: 'address',
        mpsPort: 443,
        username: 'user',
        password: 'pass',
        commonName: 'common',
        serverAddressFormat: 0,
        authMethod: 1,
        mpsRootCertificate: 'cert',
        proxyDetails: 'proxy'
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
        .update({
          configName: 'config1',
          mpsServerAddress: 'address',
          mpsPort: 443,
          username: 'user',
          password: 'pass',
          commonName: 'common',
          serverAddressFormat: 0,
          authMethod: 1,
          mpsRootCertificate: 'cert',
          proxyDetails: 'proxy'
        })
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
      service.delete('config1').subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockUrl}/config1`)
      expect(req.request.method).toBe('DELETE')
      req.flush({})
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.delete('config1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/config1`)
      req.flush(null, mockError)
    })
  })

  describe('loadMPSRootCert', () => {
    it('should call the API to load MPS root certificate', () => {
      const mockResponse = 'mockRootCert'

      service.loadMPSRootCert().subscribe((response) => {
        expect(response).toBe(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/ciracert`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }

      service.loadMPSRootCert().subscribe({
        error: (error) => {
          expect(error.status).toBe(500)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/ciracert`)
      req.flush(null, mockError)
    })
  })
})
