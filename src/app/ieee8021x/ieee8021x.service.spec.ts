import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { IEEE8021xService } from './ieee8021x.service'
import { AuthService } from '../auth.service'
import { environment } from 'src/environments/environment'
import { IEEE8021xConfig, DataWithCount, PageEventOptions } from 'src/models/models'
import { TranslateModule } from '@ngx-translate/core'

describe('IEEE8021xService', () => {
  let service: IEEE8021xService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server' }
  const mockUrl = `${mockEnvironment.rpsServer}/api/v1/admin/ieee8021xconfigs`

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        IEEE8021xService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: environment, useValue: mockEnvironment },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    service = TestBed.inject(IEEE8021xService)
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
      const mockResponse: DataWithCount<IEEE8021xConfig> = {
        data: [
          {
            profileName: 'config1',
            authenticationProtocol: 1,
            pxeTimeout: 60,
            wiredInterface: true,
            version: '1.0'
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
      const mockResponse: DataWithCount<IEEE8021xConfig> = {
        data: [
          {
            profileName: 'config1',
            authenticationProtocol: 1,
            pxeTimeout: 60,
            wiredInterface: true,
            version: '1.0'
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
      const mockConfig: IEEE8021xConfig = {
        profileName: 'config1',
        authenticationProtocol: 1,
        pxeTimeout: 60,
        wiredInterface: true,
        version: '1.0'
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
      const mockConfig: IEEE8021xConfig = {
        profileName: 'config1',
        authenticationProtocol: 1,
        pxeTimeout: 60,
        wiredInterface: true,
        version: '1.0'
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
        .create({ profileName: 'config1', authenticationProtocol: 1, pxeTimeout: 60, wiredInterface: true })
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
      const mockConfig: IEEE8021xConfig = {
        profileName: 'config1',
        authenticationProtocol: 1,
        pxeTimeout: 60,
        wiredInterface: true,
        version: '1.0'
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
        .update({ profileName: 'config1', authenticationProtocol: 1, pxeTimeout: 60, wiredInterface: true })
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
})
