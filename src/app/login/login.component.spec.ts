/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LoginComponent } from './login.component'
import { AuthService } from '../auth.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { AboutComponent } from '../core/about/about.component'
import { environment } from '../../environments/environment'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideTranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('LoginComponent', () => {
  let component: LoginComponent
  let fixture: ComponentFixture<LoginComponent>
  let authServiceSpy: SpyObj<AuthService>
  let snackBarSpy: SpyObj<MatSnackBar>
  let dialogSpy: SpyObj<MatDialog>
  let routerSpy: SpyObj<Router>
  let translate: TranslateService

  beforeEach(async () => {
    // Every spec file shares one localStorage, so start from a clean store
    // rather than stubbing the global (which would leak into other files).
    localStorage.clear()
    authServiceSpy = createSpyObj('AuthService', ['login'])
    snackBarSpy = createSpyObj('MatSnackBar', ['open'])
    dialogSpy = createSpyObj('MatDialog', ['open'])
    routerSpy = createSpyObj('Router', ['navigate'])

    TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        FormBuilder,
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({
          loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' })
        })
      ]
    })

    fixture = TestBed.createComponent(LoginComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('onSubmit', () => {
    it('should log in the user and navigate to home on success', () => {
      const mockLoginResponse = { token: 'test-token' }
      authServiceSpy.login.mockReturnValue(of(mockLoginResponse))

      component.loginForm.setValue({ userId: 'testUser', password: 'testPass' })
      component.onSubmit()

      expect(authServiceSpy.login).toHaveBeenCalledWith('testUser', 'testPass')
      expect(routerSpy.navigate).toHaveBeenCalledWith([''])
    })

    it('should open the About dialog if environment.cloud is true and doNotShowAgain is false', () => {
      const mockLoginResponse = { token: 'test-token' }
      authServiceSpy.login.mockReturnValue(of(mockLoginResponse))
      environment.cloud = true
      component.loginForm.setValue({ userId: 'testUser', password: 'testPass' })
      component.onSubmit()

      expect(dialogSpy.open).toHaveBeenCalledWith(AboutComponent)
    })

    it('should display an error snackbar for 401/405 errors', () => {
      const mockError = { status: 401, error: { message: 'Unauthorized' } }
      authServiceSpy.login.mockReturnValue(throwError(() => mockError))

      component.loginForm.setValue({ userId: 'testUser', password: 'testPass' })
      component.onSubmit()

      expect(snackBarSpy.open).toHaveBeenCalledWith('Unauthorized', undefined, SnackbarDefaults.defaultError)
    })

    it('should display a generic error snackbar for other errors', () => {
      const mockError = { status: 500 }
      authServiceSpy.login.mockReturnValue(throwError(() => mockError))

      component.loginForm.setValue({ userId: 'testUser', password: 'testPass' })
      component.onSubmit()

      expect(snackBarSpy.open).toHaveBeenCalledWith('login.error.value', undefined, SnackbarDefaults.defaultError)
    })

    it('should set isLoading to false after login attempt', () => {
      authServiceSpy.login.mockReturnValue(of({ token: 'test-token' }))

      component.loginForm.setValue({ userId: 'testUser', password: 'testPass' })
      component.onSubmit()

      expect(component.isLoading()).toBe(false)
    })
  })

  describe('toggleLoginPassVisibility', () => {
    it('should toggle the visibility of the password input', () => {
      component.loginPassInputType = 'password'

      component.toggleLoginPassVisibility()
      expect(component.loginPassInputType).toBe('text')

      component.toggleLoginPassVisibility()
      expect(component.loginPassInputType).toBe('password')
    })
  })

  describe('initialization', () => {
    it('should initialize the current year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear())
    })

    it('should initialize the login form', () => {
      expect(component.loginForm).toBeTruthy()
      expect(component.loginForm.contains('userId')).toBe(true)
      expect(component.loginForm.contains('password')).toBe(true)
    })
  })
})
