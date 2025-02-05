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

describe('AuthorizeInterceptor', () => {
  let httpClient: HttpClient
  let httpTestingController: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>
  let dialogSpy: jasmine.SpyObj<MatDialog>

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getLoggedUserToken', 'logout'])
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authorizationInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }]
    })

    httpClient = TestBed.inject(HttpClient)
    httpTestingController = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpTestingController.verify()
  })

  it('should add Authorization header if not calling /authorize', () => {
    authServiceSpy.getLoggedUserToken.and.returnValue('test-token')

    httpClient.get('/test').subscribe()

    const req = httpTestingController.expectOne('/test')
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('should not add Authorization header for /authorize endpoint', () => {
    httpClient.get('/authorize').subscribe()

    const req = httpTestingController.expectOne('/authorize')
    expect(req.request.headers.has('Authorization')).toBeFalse()
  })

  it('should add if-match header if body contains version', () => {
    authServiceSpy.getLoggedUserToken.and.returnValue('test-token')

    httpClient.post('/test', { version: '123' }).subscribe()

    const req = httpTestingController.expectOne('/test')
    expect(req.request.headers.get('if-match')).toBe('123')
  })
})
