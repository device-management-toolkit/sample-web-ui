/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { of, throwError } from 'rxjs'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { AuthService } from '../auth.service'
import { SetupComponent } from './setup.component'

describe('SetupComponent', () => {
  let fixture: ComponentFixture<SetupComponent>
  let component: SetupComponent
  let authService: SpyObj<AuthService>
  let replaceLocation: ReturnType<typeof vi.spyOn>
  let originalSignInUrl: string | undefined

  beforeEach(() => {
    window.history.replaceState(null, document.title, '/setup#setup-token')
    const runtimeConfig = window as Window & { __CONSOLE_SIGN_IN_URL__?: string }
    originalSignInUrl = runtimeConfig.__CONSOLE_SIGN_IN_URL__
    runtimeConfig.__CONSOLE_SIGN_IN_URL__ = 'https://console.example.test:8181/'
    replaceLocation = vi.spyOn(window.location, 'replace').mockImplementation(() => undefined)
    authService = createSpyObj('AuthService', [
      'getSetupStatus',
      'completeFirstRunSetup',
      'clearLocalSession'
    ])
    authService.getSetupStatus.mockReturnValue(of({ setupRequired: true }))
    TestBed.configureTestingModule({
      imports: [SetupComponent],
      providers: [{ provide: AuthService, useValue: authService }]
    })

    fixture = TestBed.createComponent(SetupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    const runtimeConfig = window as Window & { __CONSOLE_SIGN_IN_URL__?: string }
    runtimeConfig.__CONSOLE_SIGN_IN_URL__ = originalSignInUrl
    replaceLocation.mockRestore()
  })

  it('clears the fragment immediately and submits the token only in the setup request body', () => {
    authService.completeFirstRunSetup.mockReturnValue(of({ status: 'configured' }))
    expect(component.setupTokenFromFragment()).toBe(true)
    expect(component.form.controls.setupToken.value).toBe('setup-token')
    component.form.patchValue({
      username: 'admin',
      password: 'Strong-password-123!',
      confirmPassword: 'Strong-password-123!'
    })

    expect(window.location.hash).toBe('')
    component.submit()

    expect(authService.completeFirstRunSetup).toHaveBeenCalledWith(
      'setup-token',
      'admin',
      'Strong-password-123!',
      'Strong-password-123!'
    )
    expect(authService.clearLocalSession).toHaveBeenCalled()
    expect(replaceLocation).toHaveBeenCalledWith('https://console.example.test:8181/login')
  })

  it('does not submit invalid, weak, or mismatched credentials', () => {
    component.form.setValue({
      setupToken: 'setup-token',
      username: 'admin',
      password: 'aaaaaaaa',
      confirmPassword: 'different'
    })

    component.submit()

    expect(authService.completeFirstRunSetup).not.toHaveBeenCalled()
    expect(component.form.controls.password.hasError('weakPassword')).toBe(true)
  })

  it('clears setup state when the server reports setup already completed', () => {
    authService.completeFirstRunSetup.mockReturnValue(
      throwError(() => ({ status: 409, error: { code: 'SETUP_ALREADY_COMPLETED' } }))
    )
    component.form.setValue({
      setupToken: 'setup-token',
      username: 'admin',
      password: 'Strong-password-123!',
      confirmPassword: 'Strong-password-123!'
    })

    component.submit()

    expect(component.setupRequired()).toBe(false)
    expect(component.statusMessage()).toContain('Setup is already complete')
    expect(replaceLocation).not.toHaveBeenCalled()
  })

  it('shows restart guidance for an invalid or expired setup token', () => {
    authService.completeFirstRunSetup.mockReturnValue(
      throwError(() => ({ status: 401, error: { code: 'INVALID_SETUP_TOKEN' } }))
    )
    component.form.setValue({
      setupToken: 'expired-token',
      username: 'admin',
      password: 'Strong-password-123!',
      confirmPassword: 'Strong-password-123!'
    })

    component.submit()

    expect(component.statusIsError()).toBe(true)
    expect(component.statusMessage()).toContain('missing or expired')
  })

  it('shows confirmation mismatch feedback and clears it when the password matches', () => {
    component.form.setValue({
      setupToken: 'setup-token',
      username: 'admin',
      password: 'Strong-password-123!',
      confirmPassword: 'Different-password-123!'
    })

    component.submit()
    fixture.detectChanges()

    expect(authService.completeFirstRunSetup).not.toHaveBeenCalled()
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('Passwords do not match.')

    component.form.controls.password.setValue('Different-password-123!')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull()
  })
})
