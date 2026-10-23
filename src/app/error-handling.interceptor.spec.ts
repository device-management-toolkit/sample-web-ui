/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../test-helpers'
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpClient, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { errorHandlingInterceptor } from './error-handling.interceptor'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { provideTranslateService } from '@ngx-translate/core'
import { environment } from '../environments/environment'
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc'
import { Subject } from 'rxjs'

describe('ErrorHandlingInterceptor', () => {
  let httpMock: HttpTestingController
  let httpClient: HttpClient
  let authService: SpyObj<AuthService>
  let dialog: SpyObj<MatDialog>
  let snackbar: SpyObj<MatSnackBar>

  beforeEach(() => {
    const authServiceSpy = createSpyObj('AuthService', ['logout'])
    const dialogSpy = createSpyObj('MatDialog', ['open'])
    const snackbarSpy = createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideHttpClient(withInterceptors([errorHandlingInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackbarSpy }
      ]
    })

    httpMock = TestBed.inject(HttpTestingController)
    httpClient = TestBed.inject(HttpClient)
    authService = TestBed.inject(AuthService) as SpyObj<AuthService>
    dialog = TestBed.inject(MatDialog) as SpyObj<MatDialog>
    snackbar = TestBed.inject(MatSnackBar) as SpyObj<MatSnackBar>
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should handle 401 error and logout', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(authService.logout).toHaveBeenCalled()
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'error.sessionTimedOut.value' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({ exp: 'token expired' }, { status: 401, statusText: 'Unauthorized' })
  })

  it('should handle 412 error and show dialog', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'error.itemModified.value' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 412, statusText: 'Precondition Failed' })
  })

  it('should handle 409 error and show dialog', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'error.itemModified.value' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 409, statusText: 'Conflict' })
  })

  it('should handle 504 error and show snackbar', () => {
    httpClient.get('/test').subscribe()

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 504, statusText: 'Gateway Timeout' })

    expect(snackbar.open).toHaveBeenCalledExactlyOnceWith(expect.any(String), expect.any(String), { duration: 5000 })
  })

  it('should rethrow other errors', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(500)
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 500, statusText: 'Internal Server Error' })
  })

  describe('OAuth 401 refresh', () => {
    const originalUseOAuth = environment.useOAuth

    beforeEach(() => {
      environment.useOAuth = true
      authService.refreshAccessToken = vi.fn().mockResolvedValue(true)
      authService.isOAuthTokenRequest = vi.fn().mockReturnValue(false)
    })

    afterEach(() => {
      environment.useOAuth = originalUseOAuth
    })

    it('retries the request once after a successful refresh', async () => {
      let body: unknown
      httpClient.get('/test').subscribe((value) => (body = value))

      httpMock.expectOne('/test').flush({}, { status: 401, statusText: 'Unauthorized' })
      const retry = await vi.waitFor(() => httpMock.expectOne('/test'))
      retry.flush({ ok: true })

      expect(body).toEqual({ ok: true })
      expect(authService.refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(authService.logout).not.toHaveBeenCalled()
    })

    it('logs out when the refresh fails', async () => {
      authService.refreshAccessToken = vi.fn().mockResolvedValue(false)
      const failed = new Promise<number>((resolve) => {
        httpClient.get('/test').subscribe({ error: (error) => resolve(error.status) })
      })

      httpMock.expectOne('/test').flush({}, { status: 401, statusText: 'Unauthorized' })

      await expect(failed).resolves.toBe(401)
      expect(authService.logout).toHaveBeenCalledTimes(1)
      httpMock.expectNone('/test')
    })

    it('logs out when the retried request is rejected again', async () => {
      const failed = new Promise<number>((resolve) => {
        httpClient.get('/test').subscribe({ error: (error) => resolve(error.status) })
      })

      httpMock.expectOne('/test').flush({}, { status: 401, statusText: 'Unauthorized' })
      const retry = await vi.waitFor(() => httpMock.expectOne('/test'))
      retry.flush({}, { status: 401, statusText: 'Unauthorized' })

      await expect(failed).resolves.toBe(401)
      expect(authService.refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(authService.logout).toHaveBeenCalledTimes(1)
    })

    it('passes IdP token request errors to the caller without refreshing or logging out', () => {
      authService.isOAuthTokenRequest = vi.fn().mockReturnValue(true)
      let status: number | undefined
      httpClient.post('/test', {}).subscribe({ error: (error) => (status = error.status) })

      httpMock.expectOne('/test').flush({}, { status: 401, statusText: 'Unauthorized' })

      expect(status).toBe(401)
      expect(authService.refreshAccessToken).not.toHaveBeenCalled()
      expect(authService.logout).not.toHaveBeenCalled()
    })

    it('refreshes again when the same request is subscribed a second time', async () => {
      const request = httpClient.get('/test')

      for (let attempt = 1; attempt <= 2; attempt++) {
        request.subscribe()
        httpMock.expectOne('/test').flush({}, { status: 401, statusText: 'Unauthorized' })
        const retry = await vi.waitFor(() => httpMock.expectOne('/test'))
        retry.flush({})
      }

      expect(authService.refreshAccessToken).toHaveBeenCalledTimes(2)
      expect(authService.logout).not.toHaveBeenCalled()
    })

    it('does not refresh when OAuth is off', () => {
      environment.useOAuth = false
      httpClient.get('/test').subscribe({ error: () => undefined })

      httpMock.expectOne('/test').flush({}, { status: 401, statusText: 'Unauthorized' })

      expect(authService.refreshAccessToken).not.toHaveBeenCalled()
      expect(authService.logout).toHaveBeenCalledTimes(1)
    })
  })

  // Wired like main.ts: this interceptor first, then the library's OAuth one.
  describe('OAuth 401 refresh with the OAuth interceptor', () => {
    const originalUseOAuth = environment.useOAuth

    afterEach(() => {
      environment.useOAuth = originalUseOAuth
    })

    it('sends the refreshed access token on the retry', async () => {
      environment.useOAuth = true
      let accessToken = 'expired-token'
      const oauthService = { events: new Subject(), getAccessToken: () => accessToken }
      const auth = createSpyObj('AuthService', [
        'logout',
        'isOAuthTokenRequest',
        'refreshAccessToken'
      ])
      auth.isOAuthTokenRequest.mockReturnValue(false)
      auth.refreshAccessToken.mockImplementation(async () => {
        accessToken = 'fresh-token'
        return true
      })

      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideTranslateService(),
          provideHttpClient(withInterceptors([errorHandlingInterceptor]), withInterceptorsFromDi()),
          provideHttpClientTesting(),
          provideOAuthClient({ resourceServer: { allowedUrls: ['/api'], sendAccessToken: true } }),
          { provide: OAuthService, useValue: oauthService },
          { provide: AuthService, useValue: auth },
          { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
          { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open']) }
        ]
      })
      httpMock = TestBed.inject(HttpTestingController)

      TestBed.inject(HttpClient).get('/api/devices').subscribe()

      const first = httpMock.expectOne('/api/devices')
      expect(first.request.headers.get('Authorization')).toBe('Bearer expired-token')
      first.flush({}, { status: 401, statusText: 'Unauthorized' })

      const retry = await vi.waitFor(() => httpMock.expectOne('/api/devices'))
      expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token')
      retry.flush([])
      expect(auth.logout).not.toHaveBeenCalled()
    })
  })
})
