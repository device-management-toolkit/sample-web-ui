/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http'
import { MatDialog } from '@angular/material/dialog'
import { AuthorizeInterceptor } from './authorize.interceptor'
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
        provideHttpClient(withInterceptors([AuthorizeInterceptor])),
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

  it('should handle 401 error and open dialog when token is expired', () => {
    httpClient.get('/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401)
      }
    })

    const req = httpTestingController.expectOne('/test')
    req.flush({ exp: 'token expired' }, { status: 401, statusText: 'Unauthorized' })

    expect(authServiceSpy.logout).toHaveBeenCalled()
    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      data: { name: 'Session timed out. Please login again' }
    })
  })

  it('should open dialog on 412 error', () => {
    httpClient.get('/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(412)
      }
    })

    const req = httpTestingController.expectOne('/test')
    req.flush({}, { status: 412, statusText: 'Precondition Failed' })

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      data: { name: 'This item has been modified since it has been loaded. Please reload.' }
    })
  })

  it('should open dialog on 409 error', () => {
    httpClient.get('/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(409)
      }
    })

    const req = httpTestingController.expectOne('/test')
    req.flush({}, { status: 409, statusText: 'Conflict' })

    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
      data: { name: 'This item has been modified since it has been loaded. Please reload.' }
    })
  })
})
