/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { Router } from '@angular/router'
import { AuthService } from '../auth.service'
import { passwordConfirmationErrorState } from '../shared/password-confirmation-error-state'

const strongPasswordValidator: ValidatorFn = (control): ValidationErrors | null => {
  const characters = Array.from(String(control.value ?? ''))
  return characters.length >= 8 && new Set(characters).size >= 4 ? null : { weakPassword: true }
}

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
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
    ReactiveFormsModule
  ]
})
export class SetupComponent {
  private readonly authService = inject(AuthService)
  private readonly formBuilder = inject(FormBuilder)
  private readonly router = inject(Router)

  readonly isLoading = signal(false)
  readonly setupRequired = signal(false)
  readonly statusMessage = signal('')
  readonly statusIsError = signal(false)
  readonly form = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', Validators.required]
  })
  readonly confirmationErrorState = passwordConfirmationErrorState(() => this.confirmationMismatch)

  private setupToken = ''

  constructor() {
    this.setupToken = window.location.hash.slice(1)
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`)
    if (!this.setupToken) {
      this.statusIsError.set(true)
      this.statusMessage.set($localize`The setup link is missing or expired. Restart Console to create a new link.`)
      return
    }

    this.isLoading.set(true)
    this.authService
      .getSetupStatus()
      .subscribe({
        next: (status) => {
          this.setupRequired.set(status.setupRequired)
          if (!status.setupRequired) {
            this.setupToken = ''
            this.statusMessage.set($localize`Setup is already complete. Sign in with your administrator credentials.`)
          }
        },
        error: () => {
          this.statusIsError.set(true)
          this.statusMessage.set($localize`The local setup service is unavailable. Open this page on the Console host.`)
        }
      })
      .add(() => this.isLoading.set(false))
  }

  get confirmationMismatch(): boolean {
    const { password, confirmPassword } = this.form.getRawValue()
    return confirmPassword.length > 0 && password !== confirmPassword
  }

  submit(): void {
    this.form.markAllAsTouched()
    if (this.form.invalid || this.confirmationMismatch || !this.setupToken || !this.setupRequired()) {
      return
    }

    const { username, password, confirmPassword } = this.form.getRawValue()
    this.isLoading.set(true)
    this.statusMessage.set('')
    this.authService
      .completeFirstRunSetup(this.setupToken, username, password, confirmPassword)
      .subscribe({
        next: () => {
          this.setupToken = ''
          this.authService.clearLocalSession()
          void this.router.navigate(['/login'], { replaceUrl: true })
        },
        error: (error: { status?: number; error?: { code?: string } }) => {
          this.statusIsError.set(true)
          this.statusMessage.set(
            error.status === 409 || error.error?.code === 'SETUP_ALREADY_COMPLETED'
              ? $localize`Setup is already complete. Sign in with your administrator credentials.`
              : $localize`Setup could not be completed. Check the credentials and try again.`
          )
          if (error.status === 409 || error.error?.code === 'SETUP_ALREADY_COMPLETED') {
            this.setupRequired.set(false)
            this.setupToken = ''
          }
        }
      })
      .add(() => this.isLoading.set(false))
  }
}
