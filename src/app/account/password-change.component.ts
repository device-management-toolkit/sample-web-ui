/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatError, MatFormField } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { AuthService } from '../auth.service'

const strongPasswordValidator: ValidatorFn = (control): ValidationErrors | null => {
  const password = String(control.value ?? '')
  const characters = Array.from(password)
  return characters.length >= 8 && new Set(characters).size >= 4 ? null : { weakPassword: true }
}

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
  readonly statusMessage = signal('')
  readonly statusIsError = signal(false)
  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', Validators.required]
  })

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

    this.authService.changePassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: () => {
        this.statusIsError.set(false)
        this.statusMessage.set(this.translate.instant('account.passwordChange.success.value'))
        this.form.reset()
      },
      error: (error: { error?: { error?: string; message?: string } }) => {
        this.statusIsError.set(true)
        this.statusMessage.set(
          error.error?.message ??
            error.error?.error ??
            this.translate.instant('account.passwordChange.error.value')
        )
      }
    }).add(() => this.isLoading.set(false))
  }
}
