/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { AuthService } from '../auth.service'
import { adminPasswordValidator } from '../shared/admin-password.validator'
import { passwordConfirmationErrorState } from '../shared/password-confirmation-error-state'

@Component({
  selector: 'app-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss'],
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatError,
    MatFormField,
    MatHint,
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    TranslatePipe
  ]
})
export class PasswordChangeComponent {
  private readonly authService = inject(AuthService)
  private readonly formBuilder = inject(FormBuilder)
  private readonly translate = inject(TranslateService)

  readonly isLoading = signal(false)
  readonly supported = signal(true)
  readonly statusMessage = signal('')
  readonly statusIsError = signal(false)
  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, adminPasswordValidator]],
    confirmPassword: ['', Validators.required]
  })
  readonly confirmationErrorState = passwordConfirmationErrorState(() => this.confirmationMismatch)

  constructor() {
    this.authService.isPasswordChangeSupported().subscribe((supported) => {
      this.supported.set(supported)
    })
  }

  get confirmationMismatch(): boolean {
    const { newPassword, confirmPassword } = this.form.getRawValue()
    return confirmPassword.length > 0 && newPassword !== confirmPassword
  }

  submit(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid || this.confirmationMismatch) {
      return
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue()
    this.isLoading.set(true)
    this.statusMessage.set('')

    this.authService
      .changePassword(currentPassword, newPassword, confirmPassword)
      .subscribe({
        next: () => {
          this.statusIsError.set(false)
          this.statusMessage.set(this.translate.instant('account.passwordChange.success.value'))
          this.form.reset()
          this.authService.logout()
        },
        error: (error: { status?: number; error?: { error?: string } }) => {
          this.statusIsError.set(true)
          this.statusMessage.set(
            error.status === 401
              ? this.translate.instant('account.passwordChange.incorrectCurrent.value')
              : typeof error.error?.error === 'string'
                ? error.error.error
                : this.translate.instant('account.passwordChange.error.value')
          )
        }
      })
      .add(() => this.isLoading.set(false))
  }
}
