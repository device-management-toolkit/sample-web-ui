/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

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
  const originalCloud = environment.cloud

  beforeEach(() => {
    // The constructor reads the session flag, and spec order is random, so a
    // leftover flag makes the suite fail intermittently.
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
    environment.cloud = originalCloud
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('session restore on start-up', () => {
    const rebuild = (): AuthService => {
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

      const rebuilt = TestBed.inject(AuthService)
      httpMock = TestBed.inject(HttpTestingController)
      return rebuilt
    }

    describe('enterprise', () => {
      beforeEach(() => {
        environment.cloud = false
      })

      // Only the exact value login() writes counts as a session.
      const cases = [
        { flag: 'true', expected: true },
        { flag: 'false', expected: false },
        { flag: '1', expected: false },
        { flag: '', expected: false }
      ]

      cases.forEach(({ flag, expected }) => {
        it(`treats sessionActive="${flag}" as loggedIn=${expected}`, () => {
          localStorage.setItem('sessionActive', flag)

          expect(rebuild().isLoggedIn).toBe(expected)
        })
      })

      it('should purge a token left over from before the cookie migration', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ token: 'stale-token' }))

        rebuild()

        expect(localStorage.getItem('loggedInUser')).toBeNull()
      })
    })

    describe('cloud', () => {
      beforeEach(() => {
        environment.cloud = true
      })

      it('should restore the session from the stored token', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ token: 'test-token' }))

        expect(rebuild().isLoggedIn).toBeTrue()
      })

      it('should keep the token, which the Authorization header needs', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ token: 'test-token' }))

        expect(rebuild().getLoggedUserToken()).toBe('test-token')
      })

      it('should not restore a session from a corrupt token', () => {
        localStorage.setItem('loggedInUser', 'not-json')

        expect(rebuild().isLoggedIn).toBeFalse()
      })

      it('should not restore a session when the stored value has no token', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ user: 'admin' }))

        expect(rebuild().isLoggedIn).toBeFalse()
      })

      it('should not restore a session when no token is stored', () => {
        expect(rebuild().isLoggedIn).toBeFalse()
      })
    })
  })

  describe('login', () => {
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

    describe('enterprise', () => {
      beforeEach(() => {
        environment.cloud = false
      })

      it('should log in a user and update state without persisting the token', () => {
        const mockResponse = { token: 'test-token' }

        service.login('testUser', 'testPass').subscribe(() => {
          expect(service.isLoggedIn).toBeTrue()
          expect(localStorage.getItem('sessionActive')).toBe('true')
        })

        const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize`)
        expect(req.request.method).toBe('POST')
        expect(req.request.body).toEqual({ username: 'testUser', password: 'testPass' })
        req.flush(mockResponse)

        // Nothing readable may hold the session.
        expect(JSON.stringify(localStorage)).not.toContain('test-token')
      })
    })

    describe('cloud', () => {
      beforeEach(() => {
        environment.cloud = true
      })

      it('should persist the token, since Kong reads the Authorization header', () => {
        const mockResponse = { token: 'test-token' }

        service.login('testUser', 'testPass').subscribe(() => {
          expect(service.isLoggedIn).toBeTrue()
          expect(service.getLoggedUserToken()).toBe('test-token')
          expect(localStorage.getItem('sessionActive')).toBeNull()
        })

        const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize`)
        expect(req.request.method).toBe('POST')
        req.flush(mockResponse)
      })
    })
  })

  describe('logout', () => {
    it('should clear session state and navigate to login', () => {
      spyOn(localStorage, 'removeItem')

      service.logout()

      expect(service.isLoggedIn).toBeFalse()
      expect(localStorage.removeItem).toHaveBeenCalledWith('sessionActive')
      expect(localStorage.removeItem).toHaveBeenCalledWith('loggedInUser')
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
    })

    describe('enterprise', () => {
      beforeEach(() => {
        environment.cloud = false
      })

      it('should ask the server to expire the cookie when a session was active', () => {
        service.isLoggedIn = true

        service.logout()

        const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/logout`)
        expect(req.request.method).toBe('POST')
        req.flush({ message: 'logged out' })

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
      })

      it('should still log out locally when the server call fails', () => {
        service.isLoggedIn = true

        service.logout()

        const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/logout`)
        req.flush(null, { status: 500, statusText: 'Server Error' })

        expect(service.isLoggedIn).toBeFalse()
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
      })
    })

    describe('cloud', () => {
      beforeEach(() => {
        environment.cloud = true
      })

      it('should not call a logout route, since MPS has none', () => {
        service.isLoggedIn = true

        service.logout()

        httpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/authorize/logout`)
        expect(service.isLoggedIn).toBeFalse()
        expect(localStorage.getItem('loggedInUser')).toBeNull()
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
      })
    })
  })

  describe('verifyStoredSession', () => {
    it('should call a protected endpoint so the server can reject a dead token', () => {
      service.verifyStoredSession().subscribe()

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/devices/stats`)
      expect(req.request.method).toBe('GET')
      req.flush({})
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
})
