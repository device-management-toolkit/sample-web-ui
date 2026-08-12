/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { MatDialog } from '@angular/material/dialog'
import { authorizationInterceptor } from './authorize.interceptor'
import { AuthService } from './auth.service'
import { provideTranslateService } from '@ngx-translate/core'

describe('AuthorizeInterceptor', () => {
  let httpClient: HttpClient
  let httpTestingController: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>
  let dialogSpy: jasmine.SpyObj<MatDialog>

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'])
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])

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
  })

  it('should send credentials so the session cookie travels with the request', () => {
    httpClient.get('/test').subscribe()

    const req = httpTestingController.expectOne('/test')
    expect(req.request.withCredentials).toBeTrue()
  })

  it('should never attach an Authorization header', () => {
    httpClient.get('/test').subscribe()

    const req = httpTestingController.expectOne('/test')
    expect(req.request.headers.has('Authorization')).toBeFalse()
  })

  it('should send credentials on /authorize so the cookie is stored', () => {
    httpClient.post('/authorize', { username: 'u', password: 'p' }).subscribe()

    const req = httpTestingController.expectOne('/authorize')
    expect(req.request.withCredentials).toBeTrue()
    expect(req.request.headers.has('Authorization')).toBeFalse()
  })

  it('should add if-match header if body contains version', () => {
    httpClient.post('/test', { version: '123' }).subscribe()

    const req = httpTestingController.expectOne('/test')
    expect(req.request.headers.get('if-match')).toBe('123')
  })
})
