/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { AuthService } from '../auth.service'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { AboutComponent } from '../core/about/about.component'
import { environment } from 'src/environments/environment'
import { MatChipListbox, MatChipOption } from '@angular/material/chips'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton, MatButton } from '@angular/material/button'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatError, MatSuffix } from '@angular/material/form-field'
import { MatProgressBar } from '@angular/material/progress-bar'
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions,
  MatCardFooter
} from '@angular/material/card'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { OAuthService } from 'angular-oauth2-oidc'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatProgressBar,
    ReactiveFormsModule,
    MatCardContent,
    MatFormField,
    MatInput,
    MatError,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatIcon,
    MatChipListbox,
    MatChipOption,
    MatCardActions,
    MatButton,
    MatCardFooter,
    TranslateModule
  ]
})
export class LoginComponent {
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)
  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder)
  private readonly authService = inject(AuthService)
  private readonly translate = inject(TranslateService)
  private readonly oauthService

  public loginForm = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required]
  })
  public currentYear = new Date().getFullYear()
  public isLoading = signal(false)
  public errorMessage = ''
  public loginPassInputType = 'password'
  public useOAuth = environment.useOAuth

  constructor() {
    if (environment.useOAuth) {
      this.oauthService = inject(OAuthService)
    }

    if (environment.useOAuth) {
      if (environment.auth == null) {
        console.error('auth config not set but oauth=true')

        return
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true)
      const result: { userId: string; password: string } = Object.assign({}, this.loginForm.getRawValue())
      this.authService
        .login(result.userId, result.password)
        .subscribe({
          complete: () => {
            const storedValue = localStorage.getItem('doNotShowAgain')
            const doNotShowNotice = storedValue ? JSON.parse(storedValue) : false
            if (!doNotShowNotice && environment.cloud) {
              this.dialog.open(AboutComponent)
            }

            this.router.navigate([''])
          },
          error: (err) => {
            if (err.status === 405 || err.status === 401) {
              this.snackBar.open($localize`${err.error.message}`, undefined, SnackbarDefaults.defaultError)
            } else {
              const msg: string = this.translate.instant('login.error.value')

              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
            }
          }
        })
        .add(() => {
          this.isLoading.set(false)
        })
    }
  }
  oauthLogin(): void {
    this.oauthService?.initCodeFlow()
  }

  toggleLoginPassVisibility(): void {
    this.loginPassInputType = this.loginPassInputType === 'password' ? 'text' : 'password'
  }
}
