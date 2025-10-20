import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { AuthService } from './auth.service'
import { Router } from '@angular/router'
import { environment } from 'src/environments/environment'
import { MPSVersion, RPSVersion } from 'src/models/models'
import { TranslateModule } from '@ngx-translate/core'

describe('AuthService', () => {
  let service: AuthService
  let httpMock: HttpTestingController
  let routerSpy: jasmine.SpyObj<Router>

  const mockEnvironment = { mpsServer: 'https://test-mps', rpsServer: 'https://test-rps' }

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    environment.mpsServer = mockEnvironment.mpsServer
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: environment, useValue: mockEnvironment },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('login', () => {
    it('should log in a user and update state', () => {
      const mockResponse = { token: 'test-token' }

      service.login('testUser', 'testPass').subscribe(() => {
        expect(service.isLoggedIn).toBeTrue()
        expect(localStorage.getItem('loggedInUser')).toBe(JSON.stringify(mockResponse))
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({ username: 'testUser', password: 'testPass' })
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 401, statusText: 'Unauthorized' }

      service.login('testUser', 'testPass').subscribe({
        error: (error) => {
          expect(error.status).toBe(401)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize`)
      req.flush(null, mockError)
    })
  })

  describe('logout', () => {
    it('should log out the user and navigate to login', () => {
      spyOn(localStorage, 'removeItem')

      service.logout()

      expect(service.isLoggedIn).toBeFalse()
      expect(localStorage.removeItem).toHaveBeenCalledWith('loggedInUser')
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
    })
  })

  describe('getMPSVersion', () => {
    it('should fetch the MPS version', () => {
      const mockResponse: MPSVersion = { serviceVersion: '1.0.0' }

      service.getMPSVersion().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/version`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getMPSVersion().subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/version`)
      req.flush(null, mockError)
    })
  })

  describe('getRPSVersion', () => {
    it('should fetch the RPS version', () => {
      const mockResponse: RPSVersion = { serviceVersion: '1.0.0', protocolVersion: '2.0.0' }

      service.getRPSVersion().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/v1/admin/version`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getRPSVersion().subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/v1/admin/version`)
      req.flush(null, mockError)
    })
  })

  describe('getConsoleVersion', () => {
    it('should fetch the Console version', () => {
      const mockResponse: RPSVersion = { serviceVersion: '1.0.0', protocolVersion: '2.0.0' }

      service.getConsoleVersion().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/version`)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 404, statusText: 'Not Found' }

      service.getConsoleVersion().subscribe({
        error: (error) => {
          expect(error.status).toBe(404)
        }
      })

      const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/version`)
      req.flush(null, mockError)
    })
  })

  describe('onError', () => {
    it('should return error messages from validation errors', () => {
      const mockError = {
        error: {
          errors: [
            { msg: 'Invalid input', param: 'username' },
            { msg: 'Required', param: 'password' }
          ]
        }
      }

      const result = service.onError(mockError)
      expect(result).toEqual(['Invalid input: username', 'Required: password'])
    })

    it('should return a single error message if present', () => {
      const mockError = { error: { message: 'Something went wrong' } }

      const result = service.onError(mockError)
      expect(result).toEqual(['Something went wrong'])
    })

    it('should return the error itself if no specific error message is available', () => {
      const mockError = 'Generic error'

      const result = service.onError(mockError)
      expect(result).toEqual(['Generic error'])
    })
  })

  describe('compareSemver', () => {
    it('should compare semantic versions correctly', () => {
      expect(service.compareSemver('1.0.0', '1.0.1')).toBeLessThan(0)
      expect(service.compareSemver('1.2.0', '1.1.5')).toBeGreaterThan(0)
      expect(service.compareSemver('1.0.0', '1.0.0')).toBe(0)
    })
  })
})
