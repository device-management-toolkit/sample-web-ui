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
import { ThemeService } from '../../theme.service'
import { NavFooterComponent } from './nav-footer.component'
import { BehaviorSubject, of } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { environment } from '../../../environments/environment'

describe('NavFooterComponent', () => {
  let component: NavFooterComponent
  let fixture: ComponentFixture<NavFooterComponent>
  let authService: SpyObj<AuthService>
  let matDialog: SpyObj<MatDialog>
  let isLoggedInSubject: BehaviorSubject<boolean>

  const openMenu = (trigger: string): void => {
    fixture.nativeElement.querySelector(`[data-cy="${trigger}"]`).click()
    fixture.detectChanges()
  }

  // Menus render in an overlay outside the fixture.
  const menuItem = (name: string): HTMLButtonElement => document.querySelector(`[data-cy="${name}"]`)!

  const checkedItems = (): (string | null)[] =>
    Array.from(document.querySelectorAll('[role="menuitemradio"]'))
      .filter((item) => item.getAttribute('aria-checked') === 'true' && item.querySelector('.check') !== null)
      .map((item) => item.getAttribute('data-cy'))

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
        NavFooterComponent
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

    fixture = TestBed.createComponent(NavFooterComponent)
    component = fixture.componentInstance
    authService = TestBed.inject(AuthService) as SpyObj<AuthService>
    matDialog = TestBed.inject(MatDialog) as SpyObj<MatDialog>
  })

  afterEach(() => {
    TestBed.resetTestingModule()
    localStorage.removeItem('theme')
    localStorage.removeItem('palette')
    document.documentElement.className = ''
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

    expect(component.isLoggedIn()).toBe(true)
  })

  it('should show the MPS and RPS versions once logged in', () => {
    authService.getMPSVersion.mockReturnValue(of({ serviceVersion: '2.14.0' }))
    authService.getRPSVersion.mockReturnValue(of({ serviceVersion: '2.27.0' }))
    fixture.detectChanges()

    isLoggedInSubject.next(true)
    fixture.detectChanges()

    const rows = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.info-row')).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent?.trim())
    )
    expect(rows).toContainEqual(['MPS', 'v2.14.0'])
    expect(rows).toContainEqual(['RPS', 'v2.27.0'])
  })

  it('should show the Console version in console mode', () => {
    Object.defineProperty(environment, 'cloud', { writable: true, value: false })
    authService.getConsoleVersion.mockReturnValue(of({ current: 'v1.9.0', latest: { tag_name: 'v1.9.0' } }))
    const consoleFixture = TestBed.createComponent(NavFooterComponent)
    consoleFixture.detectChanges()

    isLoggedInSubject.next(true)
    consoleFixture.detectChanges()

    expect(consoleFixture.nativeElement.textContent).toContain('v1.9.0')
  })

  it('should offer the account menu only when logged in', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('account_circle')

    isLoggedInSubject.next(true)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('account_circle')
  })

  it('should show the icon of the current mode on the mode button', () => {
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-cy="themeMode"]')
    expect(button.textContent?.trim()).toBe('brightness_auto')

    TestBed.inject(ThemeService).setMode('dark')
    fixture.detectChanges()

    expect(button.textContent?.trim()).toBe('dark_mode')
  })

  it('should switch to the dark theme when dark is picked from the mode menu', () => {
    fixture.detectChanges()
    openMenu('themeMode')

    menuItem('themeMode-dark').click()

    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
  })

  it('should check only the current mode in the mode menu', () => {
    TestBed.inject(ThemeService).setMode('light')
    fixture.detectChanges()

    openMenu('themeMode')

    expect(checkedItems()).toEqual(['themeMode-light'])
  })

  it('should switch palette when one is picked from the palette menu', () => {
    fixture.detectChanges()
    openMenu('themePalette')

    menuItem('themePalette-rose').click()

    expect(document.documentElement.classList.contains('rose-palette')).toBe(true)
  })

  it('should check only the current palette in the palette menu', () => {
    TestBed.inject(ThemeService).setPalette('cyan')
    fixture.detectChanges()

    openMenu('themePalette')

    expect(checkedItems()).toEqual(['themePalette-cyan'])
  })

  it('should paint each palette swatch with its own colours', () => {
    fixture.detectChanges()
    openMenu('themePalette')

    const swatch = (name: string): Element => menuItem(name).querySelector('.swatch')!
    expect(swatch('themePalette-azure').classList.contains('azure-palette')).toBe(true)
    expect(swatch('themePalette-magenta').classList.contains('magenta-palette')).toBe(true)
  })
})
