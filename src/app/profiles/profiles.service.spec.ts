import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { ProfilesService } from './profiles.service'
import { AuthService } from '../auth.service'
import { environment } from 'src/environments/environment'
import { DataWithCount, PageEventOptions } from 'src/models/models'
import { Profile } from './profiles.constants'
import { TranslateModule } from '@ngx-translate/core'

describe('ProfilesService', () => {
  let service: ProfilesService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server' }
  const mockUrl = `${mockEnvironment.rpsServer}/api/v1/admin/profiles`

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        ProfilesService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: environment, useValue: mockEnvironment },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    service = TestBed.inject(ProfilesService)
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
      const mockResponse: DataWithCount<Profile> = {
        data: [
          {
            profileName: 'profile1',
            activation: 'activation1',
            iderEnabled: true,
            kvmEnabled: true,
            solEnabled: true,
            userConsent: 'All',
            generateRandomPassword: true,
            generateRandomMEBxPassword: true,
            dhcpEnabled: true,
            ipSyncEnabled: true,
            localWifiSyncEnabled: true,
            tags: [],
            uefiWifiSyncEnabled: false
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
      const mockResponse: DataWithCount<Profile> = {
        data: [
          {
            profileName: 'profile1',
            activation: 'activation1',
            iderEnabled: true,
            kvmEnabled: true,
            solEnabled: true,
            userConsent: 'All',
            generateRandomPassword: true,
            generateRandomMEBxPassword: true,
            dhcpEnabled: true,
            ipSyncEnabled: true,
            localWifiSyncEnabled: true,
            tags: [],
            uefiWifiSyncEnabled: false
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
      const mockProfile: Profile = {
        profileName: 'profile1',
        activation: 'activation1',
        iderEnabled: true,
        kvmEnabled: true,
        solEnabled: true,
        userConsent: 'All',
        generateRandomPassword: true,
        generateRandomMEBxPassword: true,
        dhcpEnabled: true,
        ipSyncEnabled: true,
        localWifiSyncEnabled: true,
        tags: [],
        uefiWifiSyncEnabled: false
      }

      service.getRecord('profile1').subscribe((response) => {
        expect(response).toEqual(mockProfile)
      })

      const req = httpMock.expectOne(`${mockUrl}/profile1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockProfile)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.getRecord('profile1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/profile1`)
      req.flush(null, mockError)
    })
  })

  describe('create', () => {
    it('should call the API to create a new profile', () => {
      const mockProfile: Profile = {
        profileName: 'profile1',
        activation: 'activation1',
        iderEnabled: true,
        kvmEnabled: true,
        solEnabled: true,
        userConsent: 'All',
        generateRandomPassword: true,
        generateRandomMEBxPassword: true,
        dhcpEnabled: true,
        ipSyncEnabled: true,
        localWifiSyncEnabled: true,
        tags: [],
        uefiWifiSyncEnabled: false
      }

      service.create(mockProfile).subscribe((response) => {
        expect(response).toEqual(mockProfile)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('POST')
      req.flush(mockProfile)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.create({ profileName: 'profile1', activation: 'activation1', iderEnabled: true } as any).subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(mockUrl)
      req.flush(null, mockError)
    })
  })

  describe('update', () => {
    it('should call the API to update a profile', () => {
      const mockProfile: Profile = {
        profileName: 'profile1',
        activation: 'activation1',
        iderEnabled: true,
        kvmEnabled: true,
        solEnabled: true,
        userConsent: 'All',
        generateRandomPassword: true,
        generateRandomMEBxPassword: true,
        dhcpEnabled: true,
        ipSyncEnabled: true,
        localWifiSyncEnabled: true,
        tags: [],
        uefiWifiSyncEnabled: false
      }

      service.update(mockProfile).subscribe((response) => {
        expect(response).toEqual(mockProfile)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('PATCH')
      req.flush(mockProfile)
    })

    it('should handle errors', () => {
      const mockError = { status: 400, statusText: 'Bad Request' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.update({ profileName: 'profile1', activation: 'activation1', iderEnabled: true } as any).subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(mockUrl)
      req.flush(null, mockError)
    })
  })

  describe('delete', () => {
    it('should call the API to delete a profile', () => {
      service.delete('profile1').subscribe((response) => {
        expect(response).toBeTruthy()
      })

      const req = httpMock.expectOne(`${mockUrl}/profile1`)
      expect(req.request.method).toBe('DELETE')
      req.flush({})
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.delete('profile1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/profile1`)
      req.flush(null, mockError)
    })
  })

  describe('export', () => {
    it('should call the API to export a profile', () => {
      const mockResponse = { exported: true }

      service.export('profile1', 'domain1').subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockUrl}/export/profile1?domainName=domain1`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.export('profile1', 'domain1').subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(`${mockUrl}/export/profile1?domainName=domain1`)
      req.flush(null, mockError)
    })
  })
})
