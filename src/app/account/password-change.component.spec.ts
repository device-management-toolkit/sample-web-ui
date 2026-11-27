/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { of, throwError } from 'rxjs'
import { provideTranslateService } from '@ngx-translate/core'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { AuthService } from '../auth.service'
import { PasswordChangeComponent } from './password-change.component'

describe('PasswordChangeComponent', () => {
  let fixture: ComponentFixture<PasswordChangeComponent>
  let component: PasswordChangeComponent
  let authService: SpyObj<AuthService>

  beforeEach(() => {
    authService = createSpyObj('AuthService', [
      'changePassword',
      'logout',
      'isPasswordChangeSupported'
    ])
    authService.isPasswordChangeSupported.mockReturnValue(of(true))
    TestBed.configureTestingModule({
      imports: [PasswordChangeComponent],
      providers: [provideTranslateService(), { provide: AuthService, useValue: authService }]
    })

    fixture = TestBed.createComponent(PasswordChangeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should require the current password and a strong matching new password', () => {
    component.form.setValue({
      currentPassword: '',
      newPassword: 'weak',
      confirmPassword: 'different'
    })

    component.submit()

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(component.form.controls.currentPassword.invalid).toBe(true)
    expect(component.form.controls.newPassword.hasError('weakPassword')).toBe(true)
  })

  it.each([
    'new-password-123!',
    'NEW-PASSWORD-123!',
    'New-Password-!!!',
    'NewPassword123',
    'Ne-12!'
  ])('should apply the Console password policy to %s', (newPassword) => {
    component.form.setValue({ currentPassword: 'Old-Password-1!', newPassword, confirmPassword: newPassword })

    component.submit()

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(component.form.controls.newPassword.hasError('weakPassword')).toBe(true)
  })

  it('should submit credentials and log out when the password changes', () => {
    authService.changePassword.mockReturnValue(of({ message: 'password changed' }))
    component.form.setValue({
      currentPassword: 'Old-Password-1!',
      newPassword: 'New-Password-123!',
      confirmPassword: 'New-Password-123!'
    })

    component.submit()

    expect(authService.changePassword).toHaveBeenCalledWith('Old-Password-1!', 'New-Password-123!', 'New-Password-123!')
    expect(component.statusIsError()).toBe(false)
    expect(authService.logout).toHaveBeenCalledOnce()
    expect(component.form.getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  })

  it.each([
    {
      error: { status: 401, error: { error: 'invalid credentials' } },
      message: 'account.passwordChange.incorrectCurrent.value'
    },
    {
      error: { status: 400, error: { error: 'new password must differ from current password' } },
      message: 'new password must differ from current password'
    },
    { error: { status: 500, error: '<html>' }, message: 'account.passwordChange.error.value' }
  ])('should display an error for status $error.status', ({ error, message }) => {
    authService.changePassword.mockReturnValue(throwError(() => error))
    component.form.setValue({
      currentPassword: 'Wrong-Password-1!',
      newPassword: 'New-Password-123!',
      confirmPassword: 'New-Password-123!'
    })

    component.submit()
    fixture.detectChanges()

    expect(component.statusIsError()).toBe(true)
    expect(component.statusMessage()).toBe(message)
    expect(fixture.nativeElement.textContent).toContain(message)
    expect(authService.logout).not.toHaveBeenCalled()
  })

  it('should explain instead of showing the form when Console does not support password change', () => {
    authService.isPasswordChangeSupported.mockReturnValue(of(false))
    const unsupported = TestBed.createComponent(PasswordChangeComponent)
    unsupported.detectChanges()

    expect(unsupported.nativeElement.querySelector('form')).toBeNull()
    expect(unsupported.nativeElement.textContent).toContain('account.passwordChange.unavailable.value')
  })

  it('should not submit when the new password confirmation differs', () => {
    component.form.setValue({
      currentPassword: 'Old-Password-1!',
      newPassword: 'New-Password-123!',
      confirmPassword: 'Different-Password-123!'
    })

    component.submit()
    fixture.detectChanges()

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(component.confirmationMismatch).toBe(true)
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain(
      'account.passwordChange.mismatch.value'
    )

    component.form.controls.newPassword.setValue('Different-Password-123!')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull()
  })
})
