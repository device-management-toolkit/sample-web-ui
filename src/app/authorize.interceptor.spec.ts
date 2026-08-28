/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj, type SpyObj } from '../test-helpers'
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { MatDialog } from '@angular/material/dialog'
import { authorizationInterceptor } from './authorize.interceptor'
import { AuthService } from './auth.service'
import { environment } from '../environments/environment'
import { provideTranslateService } from '@ngx-translate/core'

describe('AuthorizeInterceptor', () => {
  let httpClient: HttpClient
  let httpTestingController: HttpTestingController
  let authServiceSpy: SpyObj<AuthService>
  let dialogSpy: SpyObj<MatDialog>
  const originalCloud = environment.cloud

  beforeEach(() => {
    authServiceSpy = createSpyObj('AuthService', ['logout', 'getLoggedUserToken'])
    authServiceSpy.getLoggedUserToken.mockReturnValue('a-token')
    dialogSpy = createSpyObj('MatDialog', ['open'])

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideHttpClient(withInterceptors([authorizationInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })

    httpClient = TestBed.inject(HttpClient)
    httpTestingController = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpTestingController.verify()
    environment.cloud = originalCloud
  })

  it('should add if-match header if body contains version', () => {
    httpClient.post('/test', { version: '123' }).subscribe()

    const req = httpTestingController.expectOne('/test')
    expect(req.request.headers.get('if-match')).toBe('123')
  })

  describe('cloud', () => {
    beforeEach(() => {
      environment.cloud = true
    })

    it('should attach the bearer token Kong expects', () => {
      httpClient.get('/test').subscribe()

      const req = httpTestingController.expectOne('/test')
      expect(req.request.headers.get('Authorization')).toBe('Bearer a-token')
      expect(req.request.withCredentials).toBe(false)
    })

    it('should skip the token on /authorize, since login is unauthenticated', () => {
      httpClient.post('/authorize', { username: 'u', password: 'p' }).subscribe()

      const req = httpTestingController.expectOne('/authorize')
      expect(req.request.headers.has('Authorization')).toBe(false)
    })

    it('should attach the token on /authorize/redirection, which Kong guards', () => {
      httpClient.get('/authorize/redirection/guid').subscribe()

      const req = httpTestingController.expectOne('/authorize/redirection/guid')
      expect(req.request.headers.get('Authorization')).toBe('Bearer a-token')
    })
  })

  describe('enterprise', () => {
    beforeEach(() => {
      environment.cloud = false
    })

    it('should send credentials so the session cookie travels with the request', () => {
      httpClient.get('/test').subscribe()

      const req = httpTestingController.expectOne('/test')
      expect(req.request.withCredentials).toBe(true)
    })

    it('should never attach an Authorization header', () => {
      httpClient.get('/test').subscribe()

      const req = httpTestingController.expectOne('/test')
      expect(req.request.headers.has('Authorization')).toBe(false)
    })

    it('should send credentials on /authorize so the cookie is stored', () => {
      httpClient.post('/authorize', { username: 'u', password: 'p' }).subscribe()

      const req = httpTestingController.expectOne('/authorize')
      expect(req.request.withCredentials).toBe(true)
      expect(req.request.headers.has('Authorization')).toBe(false)
    })
  })
})
