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
    authService = createSpyObj('AuthService', ['changePassword'])
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

  it('should submit credentials and clear the form when the password changes', () => {
    authService.changePassword.mockReturnValue(of({ message: 'password changed' }))
    component.form.setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123'
    })

    it('should reject a password without enough distinct characters', () => {
      component.form.setValue({
        currentPassword: 'old-password',
        newPassword: 'aaaabbbb',
        confirmPassword: 'aaaabbbb'
      })

      component.submit()

      expect(authService.changePassword).not.toHaveBeenCalled()
      expect(component.form.controls.newPassword.hasError('weakPassword')).toBe(true)
    })

    component.submit()

    expect(authService.changePassword).toHaveBeenCalledWith(
      'old-password',
      'new-password-123',
      'new-password-123'
    )
    expect(component.statusIsError()).toBe(false)
    expect(component.form.getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  })

  it('should display an error returned by the API', () => {
    authService.changePassword.mockReturnValue(
      throwError(() => ({ error: { message: 'Current password is incorrect.' } }))
    )
    component.form.setValue({
      currentPassword: 'wrong-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123'
    })

    component.submit()
    fixture.detectChanges()

    expect(component.statusIsError()).toBe(true)
    expect(component.statusMessage()).toBe('Current password is incorrect.')
    expect(fixture.nativeElement.textContent).toContain('Current password is incorrect.')
  })

  it('should not submit when the new password confirmation differs', () => {
    component.form.setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
      confirmPassword: 'different-password-123'
    })

    component.submit()

    expect(authService.changePassword).not.toHaveBeenCalled()
    expect(component.confirmationMismatch).toBe(true)
  })
})
