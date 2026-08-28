/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { AuthService } from '../../auth.service'
import { ToolbarComponent } from './toolbar.component'
import { BehaviorSubject, of } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { environment } from '../../../environments/environment'

describe('ToolbarComponent', () => {
  let component: ToolbarComponent
  let fixture: ComponentFixture<ToolbarComponent>
  let authService: SpyObj<AuthService>
  let matDialog: SpyObj<MatDialog>
  let isLoggedInSubject: BehaviorSubject<boolean>

  beforeEach(async () => {
    // Override environment.cloud for testing
    Object.defineProperty(environment, 'cloud', {
      writable: true,
      value: true
    })

    isLoggedInSubject = new BehaviorSubject<boolean>(false)

    const authServiceSpy = createSpyObj(
      'AuthService',
      [
        'logout',
        'getMPSVersion',
        'getRPSVersion',
        'getConsoleVersion',
        'compareSemver'
      ],
      {
        isLoggedIn: isLoggedInSubject.asObservable(),
        loggedInSubject$: isLoggedInSubject
      }
    )

    authServiceSpy.getMPSVersion.mockReturnValue(of({ version: '1.0.0' }))
    authServiceSpy.getRPSVersion.mockReturnValue(of({ version: '1.0.0' }))
    authServiceSpy.getConsoleVersion.mockReturnValue(of({ version: '1.0.0' }))
    authServiceSpy.compareSemver.mockReturnValue(1)

    const matDialogSpy = createSpyObj('MatDialog', ['open'])
    const routerSpy = createSpyObj('Router', ['navigate'])

    await TestBed.configureTestingModule({
      imports: [
        ToolbarComponent
      ],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ToolbarComponent)
    component = fixture.componentInstance
    authService = TestBed.inject(AuthService) as SpyObj<AuthService>
    matDialog = TestBed.inject(MatDialog) as SpyObj<MatDialog>
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    fixture.detectChanges()
    expect(component).toBeTruthy()
  })

  it('should display dialog', () => {
    fixture.detectChanges()
    component.displayAbout()
    expect(matDialog.open).toHaveBeenCalled()
  })

  it('should logout and redirect to login page', () => {
    fixture.detectChanges()
    component.logout()
    expect(authService.logout).toHaveBeenCalled()
  })

  it('should call getMPSVersion when logged in and cloud mode', () => {
    fixture.detectChanges()
    isLoggedInSubject.next(true)

    expect(authService.getMPSVersion).toHaveBeenCalled()
  })

  it('should call getRPSVersion when logged in and cloud mode', () => {
    fixture.detectChanges()
    isLoggedInSubject.next(true)

    expect(authService.getRPSVersion).toHaveBeenCalled()
  })

  it('should subscribe to loggedInSubject on init', () => {
    fixture.detectChanges()
    isLoggedInSubject.next(true)

    expect(component.isLoggedIn).toBeTruthy()
  })
})
