import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { DomainsService } from './domains.service'
import { AuthService } from '../auth.service'
import { environment } from 'src/environments/environment'
import { DataWithCount, Domain, PageEventOptions } from 'src/models/models'
import { TranslateModule } from '@ngx-translate/core'

describe('DomainsService', () => {
  let service: DomainsService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server' }
  const mockUrl = `${mockEnvironment.rpsServer}/api/v1/admin/domains`

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = 'https://test-server'
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        DomainsService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: environment, useValue: mockEnvironment },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    service = TestBed.inject(DomainsService)
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
      const mockResponse: DataWithCount<Domain> = {
        totalCount: 1,
        data: [
          {
            profileName: 'domain1',
            domainSuffix: 'test.com',
            provisioningCert: 'cert',
            provisioningCertPassword: 'pass',
            provisioningCertStorageFormat: 'PEM',
            expirationDate: new Date()
          }
        ]
      }

      service.getData(pageEvent).subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockUrl}?$top=10&$skip=0&$count=true`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should call the API without pagination options', () => {
      const mockResponse: DataWithCount<Domain> = {
        totalCount: 1,
        data: [
          {
            profileName: 'domain1',
            domainSuffix: 'test.com',
            provisioningCert: 'cert',
            provisioningCertPassword: 'pass',
            provisioningCertStorageFormat: 'PEM',
            expirationDate: new Date()
          }
        ]
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
      const mockDomain: Domain = {
        profileName: 'domain1',
        domainSuffix: 'test.com',
        provisioningCert: 'cert',
        provisioningCertPassword: 'pass',
        provisioningCertStorageFormat: 'PEM',
        expirationDate: new Date()
      }

      service.getRecord('domain1').subscribe((response) => {
        expect(response).toEqual(mockDomain)
      })

      const req = httpMock.expectOne(`${mockUrl}/domain1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockDomain)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.getRecord('domain1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/domain1`)
      req.flush(null, mockError)
    })
  })

  describe('update', () => {
    it('should call the API to update the domain', () => {
      const mockDomain: Domain = {
        profileName: 'domain1',
        domainSuffix: 'test.com',
        provisioningCert: 'cert',
        provisioningCertPassword: 'pass',
        provisioningCertStorageFormat: 'PEM',
        expirationDate: new Date()
      }

      service.update(mockDomain).subscribe((response) => {
        expect(response).toEqual(mockDomain)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('PATCH')
      req.flush(mockDomain)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service
        .update({
          profileName: 'domain1',
          domainSuffix: 'test.com',
          provisioningCert: 'cert',
          provisioningCertPassword: 'pass',
          provisioningCertStorageFormat: 'PEM',
          expirationDate: new Date()
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

  describe('create', () => {
    it('should call the API to create a new domain', () => {
      const mockDomain: Domain = {
        profileName: 'newDomain',
        domainSuffix: 'new.com',
        provisioningCert: 'cert',
        provisioningCertPassword: 'pass',
        provisioningCertStorageFormat: 'PEM',
        expirationDate: new Date()
      }

      service.create(mockDomain).subscribe((response) => {
        expect(response).toEqual(mockDomain)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('POST')
      req.flush(mockDomain)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service
        .create({
          profileName: 'newDomain',
          domainSuffix: 'new.com',
          provisioningCert: 'cert',
          provisioningCertPassword: 'pass',
          provisioningCertStorageFormat: 'PEM',
          expirationDate: new Date()
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
    it('should call the API to delete a domain', () => {
      service.delete('domain1').subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockUrl}/domain1`)
      expect(req.request.method).toBe('DELETE')
      req.flush({})
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.delete('domain1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/domain1`)
      req.flush(null, mockError)
    })
  })
})
