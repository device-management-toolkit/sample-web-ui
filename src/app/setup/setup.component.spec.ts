/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { of, throwError } from 'rxjs'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { AuthService } from '../auth.service'
import { SetupComponent } from './setup.component'
import { Router } from '@angular/router'

describe('SetupComponent', () => {
  let fixture: ComponentFixture<SetupComponent>
  let component: SetupComponent
  let authService: SpyObj<AuthService>
  let router: SpyObj<Router>

  beforeEach(() => {
    window.history.replaceState(null, document.title, '/setup#setup-token')
    authService = createSpyObj('AuthService', [
      'getSetupStatus',
      'completeFirstRunSetup',
      'clearLocalSession'
    ])
    authService.getSetupStatus.mockReturnValue(of({ setupRequired: true }))
    router = createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({
      imports: [SetupComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    })

    fixture = TestBed.createComponent(SetupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('clears the fragment immediately and submits the token only in the setup request body', () => {
    authService.completeFirstRunSetup.mockReturnValue(of({ status: 'configured' }))
    component.form.setValue({
      username: 'admin',
      password: 'Strong-password-123',
      confirmPassword: 'Strong-password-123'
    })

    expect(window.location.hash).toBe('')
    component.submit()

    expect(authService.completeFirstRunSetup).toHaveBeenCalledWith(
      'setup-token',
      'admin',
      'Strong-password-123',
      'Strong-password-123'
    )
    expect(authService.clearLocalSession).toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true })
  })

  it('does not submit invalid, weak, or mismatched credentials', () => {
    component.form.setValue({ username: 'admin', password: 'aaaaaaaa', confirmPassword: 'different' })

    component.submit()

    expect(authService.completeFirstRunSetup).not.toHaveBeenCalled()
    expect(component.form.controls.password.hasError('weakPassword')).toBe(true)
  })

  it('clears setup state when the server reports setup already completed', () => {
    authService.completeFirstRunSetup.mockReturnValue(
      throwError(() => ({ status: 409, error: { code: 'SETUP_ALREADY_COMPLETED' } }))
    )
    component.form.setValue({
      username: 'admin',
      password: 'Strong-password-123',
      confirmPassword: 'Strong-password-123'
    })

    component.submit()

    expect(component.setupRequired()).toBe(false)
    expect(component.statusMessage()).toContain('Setup is already complete')
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('shows confirmation mismatch feedback and clears it when the password matches', () => {
    component.form.setValue({
      username: 'admin',
      password: 'Strong-password-123',
      confirmPassword: 'different-password-123'
    })

    component.submit()
    fixture.detectChanges()

    expect(authService.completeFirstRunSetup).not.toHaveBeenCalled()
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain('Passwords do not match.')

    component.form.controls.password.setValue('different-password-123')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull()
  })
})
