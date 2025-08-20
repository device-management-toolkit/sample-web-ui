/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/auth.service'
import { ToolbarComponent } from './toolbar.component'
import { BehaviorSubject, of } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { environment } from 'src/environments/environment'

describe('ToolbarComponent', () => {
  let component: ToolbarComponent
  let fixture: ComponentFixture<ToolbarComponent>
  let authService: jasmine.SpyObj<AuthService>
  let matDialog: jasmine.SpyObj<MatDialog>
  let isLoggedInSubject: BehaviorSubject<boolean>

  beforeEach(async () => {
    // Override environment.cloud for testing
    Object.defineProperty(environment, 'cloud', {
      writable: true,
      value: true
    })

    isLoggedInSubject = new BehaviorSubject<boolean>(false)

    const authServiceSpy = jasmine.createSpyObj(
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

    authServiceSpy.getMPSVersion.and.returnValue(of({ version: '1.0.0' }))
    authServiceSpy.getRPSVersion.and.returnValue(of({ version: '1.0.0' }))
    authServiceSpy.getConsoleVersion.and.returnValue(of({ version: '1.0.0' }))
    authServiceSpy.compareSemver.and.returnValue(1)

    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'])

    await TestBed.configureTestingModule({
      imports: [
        ToolbarComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: Router, useValue: routerSpy }]
    }).compileComponents()

    fixture = TestBed.createComponent(ToolbarComponent)
    component = fixture.componentInstance
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>
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
