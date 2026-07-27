import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { AuthService } from './auth.service'
import { Router } from '@angular/router'
import { environment } from '../environments/environment'
import { MPSVersion, RPSVersion } from '../models/models'
import { provideTranslateService } from '@ngx-translate/core'

describe('AuthService', () => {
  let service: AuthService
  let httpMock: HttpTestingController
  let routerSpy: jasmine.SpyObj<Router>

  const mockEnvironment = { mpsServer: 'https://test-mps', rpsServer: 'https://test-rps' }
  const createJwtWithExp = (expSeconds: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
    const payload = btoa(JSON.stringify({ exp: expSeconds }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
    return `${header}.${payload}.signature`
  }

  beforeEach(() => {
    localStorage.clear()

    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    environment.mpsServer = mockEnvironment.mpsServer
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
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
    localStorage.clear()
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
            { msg: 'Invalid input', path: 'username' },
            { msg: 'Required', path: 'password' }
          ]
        }
      }

      const result = service.onError(mockError)
      expect(result).toEqual(['Invalid input', 'Required'])
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

  describe('constructor token validation', () => {
    it('should accept a non-expired token from localStorage', () => {
      const validJwt = createJwtWithExp(Math.floor(Date.now() / 1000) + 300)
      localStorage.setItem('loggedInUser', JSON.stringify({ token: validJwt }))

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          AuthService,
          { provide: Router, useValue: routerSpy },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      })

      const newService = TestBed.inject(AuthService)
      const newHttpMock = TestBed.inject(HttpTestingController)

      // Should not make any HTTP calls during construction
      newHttpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)

      expect(newService.isLoggedIn).toBeTrue()
      expect(localStorage.getItem('loggedInUser')).not.toBeNull()
      newHttpMock.verify()
    })

    it('should accept a recently expired token within the clock-skew tolerance', () => {
      // Token expired 3 minutes ago (within 5-minute tolerance)
      const toleratedJwt = createJwtWithExp(Math.floor(Date.now() / 1000) - 3 * 60)
      localStorage.setItem('loggedInUser', JSON.stringify({ token: toleratedJwt }))

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          AuthService,
          { provide: Router, useValue: routerSpy },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      })

      const newService = TestBed.inject(AuthService)
      const newHttpMock = TestBed.inject(HttpTestingController)

      // Should not make a server call for tokens still valid within skew tolerance
      newHttpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)

      expect(newService.isLoggedIn).toBeTrue()
      expect(localStorage.getItem('loggedInUser')).not.toBeNull()
      newHttpMock.verify()
    })

    it('should clear expired token from localStorage', () => {
      // Token expired 10 minutes ago (beyond 5-minute tolerance)
      const expiredJwt = createJwtWithExp(Math.floor(Date.now() / 1000) - 10 * 60)
      localStorage.setItem('loggedInUser', JSON.stringify({ token: expiredJwt }))

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          AuthService,
          { provide: Router, useValue: routerSpy },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      })

      const newService = TestBed.inject(AuthService)
      const newHttpMock = TestBed.inject(HttpTestingController)

      // Should not make a server call for expired tokens
      newHttpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)

      expect(newService.isLoggedIn).toBeFalse()
      expect(localStorage.getItem('loggedInUser')).toBeNull()
      newHttpMock.verify()
    })

    it('should clear malformed token from localStorage', () => {
      localStorage.setItem('loggedInUser', JSON.stringify({ token: 'bad.jwt' }))

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          AuthService,
          { provide: Router, useValue: routerSpy },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      })

      const newService = TestBed.inject(AuthService)
      const newHttpMock = TestBed.inject(HttpTestingController)

      // Should not make a server call for malformed tokens
      newHttpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)

      expect(newService.isLoggedIn).toBeFalse()
      expect(localStorage.getItem('loggedInUser')).toBeNull()
      newHttpMock.verify()
    })

    it('should handle corrupted localStorage JSON gracefully', () => {
      // Simulate corrupted localStorage (invalid JSON)
      localStorage.setItem('loggedInUser', 'not-valid-json{]')

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          AuthService,
          { provide: Router, useValue: routerSpy },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      })

      const newService = TestBed.inject(AuthService)
      const newHttpMock = TestBed.inject(HttpTestingController)

      // Should not crash app startup
      newHttpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)

      // Should clear corrupted data and not be logged in
      expect(newService.isLoggedIn).toBeFalse()
      expect(localStorage.getItem('loggedInUser')).toBeNull()
      newHttpMock.verify()
    })
  })
})
