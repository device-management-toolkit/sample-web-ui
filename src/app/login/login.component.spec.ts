/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing'
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
  let httpClientSpy: { get: jasmine.Spy, post: jasmine.Spy, patch: jasmine.Spy, delete: jasmine.Spy }
  let routerSpy
  let authService: any
  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'delete', 'patch'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    authService = new AuthService(httpClientSpy as any, routerSpy)

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

  it('onSubmit login should be successful', fakeAsync(() => {
    const userId: string = 'userId'
    const password: string = 'P@ssw0rd'
    component.loginForm.patchValue({
      userId: userId,
      password: password
    })
    spyOn(authService, 'login').and.returnValue(of(true).pipe())
    void component.onSubmit().then(() => {
      expect(authService.login).toHaveBeenCalledOnceWith(userId, password)
      expect(component.isLoading).toBeFalse()
    })
    tick()
  }))

  it('Should fail when login service throws 405 status', async () => {
    spyOn(authService, 'login').and.returnValue(throwError({ status: 405, error: { message: 'failed' } }))
    Object.defineProperty(component.loginForm, 'valid', {
      get: () => true
    })
    await component.onSubmit()
    expect(authService.login).toHaveBeenCalled()
  })

  it('Should fail when login service throws an error', async () => {
    spyOn(authService, 'login').and.returnValue(throwError({ status: 401, error: { message: 'failed' } }))
    Object.defineProperty(component.loginForm, 'valid', {
      get: () => true
    })
    await component.onSubmit()
    expect(authService.login).toHaveBeenCalled()
  })
})
