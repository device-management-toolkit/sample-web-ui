/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../test-helpers'
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { AuthService } from './auth.service'
import { Router } from '@angular/router'
import { environment } from '../environments/environment'
import { MPSVersion, RPSVersion } from '../models/models'
import { provideTranslateService } from '@ngx-translate/core'
import { OAuthEvent, OAuthInfoEvent, OAuthService } from 'angular-oauth2-oidc'
import { Subject } from 'rxjs'

describe('AuthService', () => {
  let service: AuthService
  let httpMock: HttpTestingController
  let routerSpy: SpyObj<Router>

  const mockEnvironment = { mpsServer: 'https://test-mps', rpsServer: 'https://test-rps' }
  const originalCloud = environment.cloud
  const originalAuthDisabled = environment.authDisabled

  beforeEach(() => {
    // The constructor reads the session flag, and spec order is random, so a
    // leftover flag makes the suite fail intermittently.
    localStorage.clear()
    routerSpy = createSpyObj('Router', ['navigate'])
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
    environment.authDisabled = originalAuthDisabled
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

    describe('auth disabled', () => {
      beforeEach(() => {
        environment.cloud = false
        environment.authDisabled = true
      })

      it('should open protected routes without creating a session', () => {
        const rebuilt = rebuild()
        let canActivate = false
        rebuilt.canActivateProtectedRoutes$.subscribe((value) => (canActivate = value))

        expect(canActivate).toBe(true)
        expect(rebuilt.isLoggedIn).toBe(false)
        expect(rebuilt.loggedInSubject$.value).toBe(false)
      })
    })

    describe('cloud', () => {
      beforeEach(() => {
        environment.cloud = true
      })

      it('should restore the session from the stored token', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ token: 'test-token' }))

        expect(rebuild().isLoggedIn).toBe(true)
      })

      it('should keep the token, which the Authorization header needs', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ token: 'test-token' }))

        expect(rebuild().getLoggedUserToken()).toBe('test-token')
      })

      it('should not restore a session from a corrupt token', () => {
        localStorage.setItem('loggedInUser', 'not-json')

        expect(rebuild().isLoggedIn).toBe(false)
      })

      it('should not restore a session when the stored value has no token', () => {
        localStorage.setItem('loggedInUser', JSON.stringify({ user: 'admin' }))

        expect(rebuild().isLoggedIn).toBe(false)
      })

      it('should not restore a session when no token is stored', () => {
        expect(rebuild().isLoggedIn).toBe(false)
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

        service.login('testUser', 'testPass').subscribe()

        const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize`)
        expect(req.request.method).toBe('POST')
        expect(req.request.body).toEqual({ username: 'testUser', password: 'testPass' })
        req.flush(mockResponse)

        expect(service.isLoggedIn).toBe(true)
        expect(localStorage.getItem('sessionActive')).toBe('true')

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

        service.login('testUser', 'testPass').subscribe()

        const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize`)
        expect(req.request.method).toBe('POST')
        req.flush(mockResponse)

        expect(service.isLoggedIn).toBe(true)
        expect(service.getLoggedUserToken()).toBe('test-token')
        expect(localStorage.getItem('sessionActive')).toBeNull()
      })
    })
  })

  describe('logout', () => {
    it('should clear session state and navigate to login', () => {
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem')

      service.logout()

      expect(service.isLoggedIn).toBe(false)
      expect(removeItemSpy).toHaveBeenCalledWith('sessionActive')
      expect(removeItemSpy).toHaveBeenCalledWith('loggedInUser')
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

        expect(service.isLoggedIn).toBe(false)
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
      })
    })

    describe('auth disabled', () => {
      beforeEach(() => {
        environment.cloud = false
        environment.authDisabled = true
      })

      it('should stay logged in, since there is no login page to return to', () => {
        service.isLoggedIn = true

        service.logout()

        httpMock.expectNone(`${mockEnvironment.mpsServer}/api/v1/authorize/logout`)
        expect(service.isLoggedIn).toBe(true)
        expect(routerSpy.navigate).not.toHaveBeenCalled()
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
        expect(service.isLoggedIn).toBe(false)
        expect(localStorage.getItem('loggedInUser')).toBeNull()
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
      })
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

  describe('OAuth token renewal', () => {
    const originalUseOAuth = environment.useOAuth
    let events: Subject<OAuthEvent>
    let oauthService: SpyObj<OAuthService>

    const rebuild = (): AuthService => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          AuthService,
          { provide: Router, useValue: routerSpy },
          { provide: OAuthService, useValue: oauthService },
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      })

      const rebuilt = TestBed.inject(AuthService)
      httpMock = TestBed.inject(HttpTestingController)
      return rebuilt
    }

    beforeEach(() => {
      environment.useOAuth = true
      events = new Subject<OAuthEvent>()
      oauthService = createSpyObj(
        'OAuthService',
        [
          'hasValidAccessToken',
          'getRefreshToken',
          'refreshToken',
          'logOut'
        ],
        {
          events,
          tokenEndpoint: 'https://idp.example.com/oauth2/token'
        }
      )
      oauthService.hasValidAccessToken.mockReturnValue(true)
      oauthService.getRefreshToken.mockReturnValue('refresh-token')
      oauthService.refreshToken.mockResolvedValue({})
    })

    afterEach(() => {
      environment.useOAuth = originalUseOAuth
    })

    it('refreshes when the access token is about to expire', () => {
      rebuild()

      events.next(new OAuthInfoEvent('token_expires', 'access_token'))

      expect(oauthService.refreshToken).toHaveBeenCalledTimes(1)
    })

    it('does not refresh when only the ID token is about to expire', () => {
      rebuild()

      events.next(new OAuthInfoEvent('token_expires', 'id_token'))

      expect(oauthService.refreshToken).not.toHaveBeenCalled()
    })

    it('does not call the IdP without a refresh token', async () => {
      oauthService.getRefreshToken.mockReturnValue(null)
      const auth = rebuild()

      events.next(new OAuthInfoEvent('token_expires', 'access_token'))

      await expect(auth.refreshAccessToken()).resolves.toBe(false)
      expect(oauthService.refreshToken).not.toHaveBeenCalled()
    })

    it('shares one refresh between concurrent callers', async () => {
      const auth = rebuild()

      const results = await Promise.all([auth.refreshAccessToken(), auth.refreshAccessToken()])

      expect(results).toEqual([true, true])
      expect(oauthService.refreshToken).toHaveBeenCalledTimes(1)
    })

    it('resolves false when the IdP refuses, and tries again on the next call', async () => {
      oauthService.refreshToken.mockRejectedValueOnce(new Error('invalid_grant'))
      const auth = rebuild()

      await expect(auth.refreshAccessToken()).resolves.toBe(false)
      await expect(auth.refreshAccessToken()).resolves.toBe(true)
      expect(oauthService.refreshToken).toHaveBeenCalledTimes(2)
    })

    it('recognises only the IdP token endpoint as the token request', () => {
      const auth = rebuild()

      expect(auth.isOAuthTokenRequest('https://idp.example.com/oauth2/token')).toBe(true)
      expect(auth.isOAuthTokenRequest('https://console.example.com/api/v1/devices')).toBe(false)
    })

    it('renews on start-up an access token that expired while the app was closed', async () => {
      oauthService.hasValidAccessToken.mockReturnValue(false)
      const auth = rebuild()

      await auth.renewExpiredSession()

      expect(oauthService.refreshToken).toHaveBeenCalledTimes(1)
    })

    it('does not renew on start-up while the access token is still valid', async () => {
      const auth = rebuild()

      await auth.renewExpiredSession()

      expect(oauthService.refreshToken).not.toHaveBeenCalled()
    })

    it('does not renew on start-up without a refresh token', async () => {
      oauthService.hasValidAccessToken.mockReturnValue(false)
      oauthService.getRefreshToken.mockReturnValue(null)
      const auth = rebuild()

      await auth.renewExpiredSession()

      expect(oauthService.refreshToken).not.toHaveBeenCalled()
    })

    it('holds an expiry that fires before discovery and renews once start-up has the token endpoint', async () => {
      Object.assign(oauthService, { tokenEndpoint: null })
      const auth = rebuild()

      expect(() => events.next(new OAuthInfoEvent('token_expires', 'access_token'))).not.toThrow()
      expect(oauthService.refreshToken).not.toHaveBeenCalled()

      Object.assign(oauthService, { tokenEndpoint: 'https://idp.example.com/oauth2/token' })
      await auth.renewExpiredSession()

      expect(oauthService.refreshToken).toHaveBeenCalledTimes(1)
    })

    it('resolves false without a token endpoint', async () => {
      Object.assign(oauthService, { tokenEndpoint: null })
      const auth = rebuild()

      await expect(auth.refreshAccessToken()).resolves.toBe(false)
      expect(oauthService.refreshToken).not.toHaveBeenCalled()
    })

    it('resolves false when the library throws before sending the request', async () => {
      oauthService.refreshToken.mockImplementation(() => {
        throw new Error('tokenEndpoint must use HTTPS')
      })
      const auth = rebuild()

      await expect(auth.refreshAccessToken()).resolves.toBe(false)
    })

    it('never refreshes when OAuth is off', async () => {
      environment.useOAuth = false
      const auth = rebuild()

      await expect(auth.refreshAccessToken()).resolves.toBe(false)
      expect(auth.isOAuthTokenRequest('https://idp.example.com/oauth2/token')).toBe(false)
      await expect(auth.renewExpiredSession()).resolves.toBeUndefined()
      expect(oauthService.refreshToken).not.toHaveBeenCalled()
    })
  })
})
