/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { AuthService } from './auth.service'
import { RouterTestingModule } from '@angular/router/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SharedModule } from './shared/shared.module'
import { of } from 'rxjs'
import { environment } from 'src/environments/environment'

describe('AuthService', () => {
  let service: AuthService
  let httpClientSpy: { post: jasmine.Spy }
  let routerSpy: Router
  let loggedInSubjectSpy: jasmine.Spy

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post'])
    httpClientSpy.post.and.returnValue(of({ token: 'token' }))
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])]
    })
    service = new AuthService(httpClientSpy as any, routerSpy)
    loggedInSubjectSpy = spyOn(service.loggedInSubject, 'next').and.callThrough()
  })
  afterEach(() => {
    localStorage.removeItem('loggedInUser')
    TestBed.resetTestingModule()
  })

  it('should be created when not logged in', () => {
    expect(service).toBeTruthy()
    expect(service.isLoggedIn).toBeFalse()
    expect(loggedInSubjectSpy).not.toHaveBeenCalled()
  })

  it('should be created when logged in', () => {
    localStorage.setItem('loggedInUser', JSON.stringify({ token: 'token' }))

    const testService = new AuthService(httpClientSpy as any, routerSpy)

    expect(testService).toBeTruthy()
    expect(testService.isLoggedIn).toBeTrue()
    // expect(loggedInSubjectSpy2).toHaveBeenCalledWith(true) can't spy on this
  })
  it('should handle kong proxy route', () => {
    environment.mpsServer = './mps'
    const testService = new AuthService(httpClientSpy as any, routerSpy)
    expect(testService.url).toBe('./mps/login/api/v1/authorize')
  })
  it('should handle when non kong proxy route', () => {
    environment.mpsServer = './m'
    const testService = new AuthService(httpClientSpy as any, routerSpy)
    expect(testService.url).toBe('./m/api/v1/authorize')
  })

  it('should return token from localstorage', () => {
    localStorage.setItem('loggedInUser', JSON.stringify({ token: '1234567qwertsdfg' }))
    const getToken: any = localStorage.getItem('loggedInUser')
    const token: string = JSON.parse(getToken).token
    expect(service.getLoggedUserToken()).toBe(token)
  })

  it('should logout', async () => {
    const localStorageSetSpy = spyOn(localStorage, 'removeItem').and.callThrough()

    await service.logout()
    expect(service.router.navigate).toHaveBeenCalledWith(['/login'])
    expect(service.isLoggedIn).toBeFalse()
    expect(localStorageSetSpy).toHaveBeenCalledWith('loggedInUser')
    expect(loggedInSubjectSpy).toHaveBeenCalledWith(false)
  })

  it('should login', () => {
    service.login('username', 'password').subscribe(() => {
      expect(httpClientSpy.post).toHaveBeenCalledWith(service.url, { username: 'username', password: 'password' })
      expect(service.isLoggedIn).toBeTrue()
      expect(localStorage.loggedInUser).toBe(JSON.stringify({ token: 'token' }))
      expect(loggedInSubjectSpy).toHaveBeenCalledWith(true)
    })
  })

  it('should return error messages', () => {
    expect(service.onError('test')).toEqual(['test'])
  })

  it('should user errors return error messages', () => {
    const errors = { error: { errors: [{ msg: 'test', param: '1234', location: 'string', value: 'string' }] } }
    expect(service.onError(errors)).toEqual(['test: 1234'])
  })

  it('should user error object return error messages', () => {
    const errors = { error: { message: 'test' } }
    expect(service.onError(errors)).toEqual(['test'])
  })
})
