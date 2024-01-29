/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { AuthService } from '../auth.service'
import { SharedModule } from '../shared/shared.module'

import { LoginComponent } from './login.component'

describe('LoginComponent', () => {
  let component: LoginComponent
  let fixture: ComponentFixture<LoginComponent>
  let httpClientSpy: any
  let routerSpy
  let authService: any
  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'delete', 'patch'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    authService = new AuthService(httpClientSpy, routerSpy)

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, ReactiveFormsModule],
      declarations: [LoginComponent],
      providers: [{ provide: Router, useValue: routerSpy }, { provide: AuthService, useValue: authService }]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
  it('should turn login pass visibility on when it is off', () => {
    component.loginPassInputType = 'password'
    component.toggleLoginPassVisibility()

    expect(component.loginPassInputType).toEqual('text')
  })

  it('should turn login pass visibility off when it is on', () => {
    component.loginPassInputType = 'text'
    component.toggleLoginPassVisibility()

    expect(component.loginPassInputType).toEqual('password')
  })

  it('onSubmit login should be successful', () => {
    const userId: string = 'userId'
    const password: string = 'P@ssw0rd'
    component.loginForm.patchValue({
      userId,
      password
    })
    spyOn(authService, 'login').and.returnValue(of(true).pipe())
    component.onSubmit()
    expect(authService.login).toHaveBeenCalledOnceWith(userId, password)
    expect(component.isLoading).toBeFalse()
  })

  it('Should fail when login service throws 405 status', () => {
    const authSpy = spyOn(authService, 'login').and.returnValue(throwError(() => {
      return { status: 405, error: { message: 'failed' } }
    }))
    const snackBarSpy = spyOn(component.snackBar, 'open')
    Object.defineProperty(component.loginForm, 'valid', {
      get: () => true
    })
    fixture.detectChanges()
    component.onSubmit()
    fixture.detectChanges()
    expect(authSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })

  it('Should fail when login service throws an error', () => {
    spyOn(authService, 'login').and.returnValue(throwError(() => { return { status: 401, error: { message: 'failed' } } }))
    Object.defineProperty(component.loginForm, 'valid', {
      get: () => true
    })
    component.onSubmit()
    expect(authService.login).toHaveBeenCalled()
  })

  it('onSubmit login should be successful and should show about notice', () => {
    const userId: string = 'userId'
    const password: string = 'P@ssw0rd'
    component.loginForm.patchValue({
      userId,
      password
    })
    spyOn(authService, 'login').and.returnValue(of(true).pipe())
    spyOn(localStorage, 'getItem').and.returnValue('')
    component.onSubmit()
    expect(authService.login).toHaveBeenCalledOnceWith(userId, password)
    expect(component.isLoading).toBeFalse()
    expect(localStorage.getItem).toHaveBeenCalledWith('doNotShowAgain')
  })

  it('onSubmit login should be successful and should not show about notice', () => {
    const userId: string = 'userId'
    const password: string = 'P@ssw0rd'
    component.loginForm.patchValue({
      userId,
      password
    })
    spyOn(authService, 'login').and.returnValue(of(true).pipe())
    spyOn(localStorage, 'getItem').and.returnValue('true')
    component.onSubmit()
    expect(authService.login).toHaveBeenCalledOnceWith(userId, password)
    expect(component.isLoading).toBeFalse()
    expect(localStorage.getItem).toHaveBeenCalledWith('doNotShowAgain')
  })
})
