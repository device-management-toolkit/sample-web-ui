/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../test-helpers'
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { AuthService } from './auth.service'
import { Router } from '@angular/router'
import { environment } from '../environments/environment'
import { MPSVersion, RPSVersion } from '../models/models'
import { provideTranslateService } from '@ngx-translate/core'
import { authorizationInterceptor } from './authorize.interceptor'
import { errorHandlingInterceptor } from './error-handling.interceptor'

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

  describe('changePassword', () => {
    it('should send current and new passwords to the protected Console endpoint', () => {
      service.changePassword('old-password', 'new-password-123', 'new-password-123').subscribe()

      const req = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/password`)
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
        confirmPassword: 'new-password-123'
      })
      req.flush({ message: 'password changed' })
    })
  })

  describe('auth form interceptor integration', () => {
    let dialog: SpyObj<MatDialog>

    beforeEach(() => {
      TestBed.resetTestingModule()
      environment.cloud = false
      environment.authDisabled = false
      dialog = createSpyObj('MatDialog', ['open'])
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          provideHttpClient(withInterceptors([authorizationInterceptor, errorHandlingInterceptor])),
          provideHttpClientTesting(),
          { provide: Router, useValue: routerSpy },
          { provide: MatDialog, useValue: dialog },
          { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open']) }
        ]
      })
      service = TestBed.inject(AuthService)
      httpMock = TestBed.inject(HttpTestingController)
      service.isLoggedIn = true
      service.loggedInSubject$.next(true)
      localStorage.setItem('sessionActive', 'true')
    })

    it('surfaces an incorrect current password without logging out or showing a session dialog', () => {
      let responseStatus = 0
      service.changePassword('wrong', 'New-password-123!', 'New-password-123!').subscribe({
        error: (error) => (responseStatus = error.status)
      })

      const request = httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/password`)
      expect(request.request.withCredentials).toBe(true)
      request.flush(
        { error: 'invalid credentials', message: 'Incorrect Username and/or Password!' },
        { status: 401, statusText: 'Unauthorized' }
      )

      expect(responseStatus).toBe(401)
      expect(service.isLoggedIn).toBe(true)
      expect(localStorage.getItem('sessionActive')).toBe('true')
      expect(routerSpy.navigate).not.toHaveBeenCalled()
      expect(dialog.open).not.toHaveBeenCalled()
    })

    it('still logs out when the password-change session itself is invalid', () => {
      service.changePassword('old', 'New-password-123!', 'New-password-123!').subscribe()
      httpMock
        .expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/password`)
        .flush({ error: 'invalid access token' }, { status: 401, statusText: 'Unauthorized' })
      httpMock.expectOne(`${mockEnvironment.mpsServer}/api/v1/authorize/logout`).flush({})

      expect(service.isLoggedIn).toBe(false)
      expect(localStorage.getItem('sessionActive')).toBeNull()
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'])
      expect(dialog.open).toHaveBeenCalledOnce()
    })

    it.each([
      { status: 409, code: 'SETUP_ALREADY_COMPLETED' },
      { status: 401, code: 'INVALID_SETUP_TOKEN' }
    ])('leaves setup error $code to the setup page', ({ status, code }) => {
      let responseCode = ''
      service.completeFirstRunSetup('token', 'admin', 'Password-123!', 'Password-123!').subscribe({
        error: (error) => (responseCode = error.error.code)
      })
      const request = httpMock.expectOne('/api/v1/auth/setup')
      expect(request.request.withCredentials).toBe(false)
      request.flush({ code }, { status, statusText: 'Setup rejected' })

      expect(responseCode).toBe(code)
      expect(dialog.open).not.toHaveBeenCalled()
      expect(service.isLoggedIn).toBe(true)
    })
  })

  describe('isPasswordChangeSupported', () => {
    const passwordUrl = `${mockEnvironment.mpsServer}/api/v1/authorize/password`
    const originalUseOAuth = environment.useOAuth

    beforeEach(() => {
      environment.cloud = false
      environment.authDisabled = false
      environment.useOAuth = false
    })

    afterEach(() => {
      environment.useOAuth = originalUseOAuth
    })

    it.each([
      {
        name: 'keyring backend rejects the empty probe',
        body: { error: 'current password, new password, and confirmation are required' },
        status: 400,
        expected: true
      },
      { name: 'route is not registered (config backend)', body: '404 page not found', status: 404, expected: false },
      { name: 'unexpected success', body: { message: 'password changed' }, status: 200, expected: false }
    ])('reports $expected when $name', ({ body, status, expected }) => {
      let supported: boolean | undefined
      service.isPasswordChangeSupported().subscribe((value) => (supported = value))

      const request = httpMock.expectOne(passwordUrl)
      expect(request.request.method).toBe('POST')
      expect(request.request.body).toEqual({})
      request.flush(body, { status, statusText: 'probe' })

      expect(supported).toBe(expected)
    })

    it('reports false when the embedded UI answers with index.html', () => {
      let supported: boolean | undefined
      service.isPasswordChangeSupported().subscribe((value) => (supported = value))

      httpMock.expectOne(passwordUrl).flush('<!doctype html><app-root></app-root>', { status: 200, statusText: 'OK' })

      expect(supported).toBe(false)
    })

    it.each([
      { name: 'cloud', cloud: true, oauth: false, disabled: false },
      { name: 'OAuth', cloud: false, oauth: true, disabled: false },
      { name: 'auth disabled', cloud: false, oauth: false, disabled: true }
    ])('reports false without a request in $name mode', ({ cloud, oauth, disabled }) => {
      environment.cloud = cloud
      environment.useOAuth = oauth
      environment.authDisabled = disabled
      let supported: boolean | undefined
      service.isPasswordChangeSupported().subscribe((value) => (supported = value))

      httpMock.expectNone(passwordUrl)
      expect(supported).toBe(false)
    })
  })

  describe('first-run setup', () => {
    it('reports no setup required without a request when Console injects no setup API', () => {
      const runtimeConfig = window as Window & { __CONSOLE_SETUP_API__?: string }
      const originalSetupApi = runtimeConfig.__CONSOLE_SETUP_API__
      runtimeConfig.__CONSOLE_SETUP_API__ = ''
      let required: boolean | undefined

      service.getSetupStatus().subscribe((status) => (required = status.setupRequired))

      httpMock.expectNone(() => true)
      expect(required).toBe(false)
      runtimeConfig.__CONSOLE_SETUP_API__ = originalSetupApi
    })

    it('asks the injected setup API for status', () => {
      const runtimeConfig = window as Window & { __CONSOLE_SETUP_API__?: string }
      const originalSetupApi = runtimeConfig.__CONSOLE_SETUP_API__
      runtimeConfig.__CONSOLE_SETUP_API__ = 'https://localhost:40000'
      let required: boolean | undefined

      service.getSetupStatus().subscribe((status) => (required = status.setupRequired))

      const req = httpMock.expectOne('https://localhost:40000/api/v1/auth/setup/status')
      expect(req.request.withCredentials).toBe(false)
      req.flush({ setupRequired: true })
      expect(required).toBe(true)
      runtimeConfig.__CONSOLE_SETUP_API__ = originalSetupApi
    })

    it('sends the one-time token and credentials in a request without cookies', () => {
      const runtimeConfig = window as Window & { __CONSOLE_SETUP_API__?: string }
      const originalSetupApi = runtimeConfig.__CONSOLE_SETUP_API__
      runtimeConfig.__CONSOLE_SETUP_API__ = 'https://localhost:40000'

      service.completeFirstRunSetup('one-time-token', 'admin', 'Password-123!', 'Password-123!').subscribe()

      const req = httpMock.expectOne('https://localhost:40000/api/v1/auth/setup')
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({
        token: 'one-time-token',
        username: 'admin',
        password: 'Password-123!',
        confirmPassword: 'Password-123!'
      })
      expect(req.request.withCredentials).toBe(false)
      req.flush({ status: 'configured' })
      runtimeConfig.__CONSOLE_SETUP_API__ = originalSetupApi
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
})
