/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
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
import { TranslateModule } from '@ngx-translate/core'
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
  snackBar = inject(MatSnackBar)
  dialog = inject(MatDialog)
  router = inject(Router)
  fb = inject(FormBuilder)
  authService = inject(AuthService)
  oauthService

  public loginForm: FormGroup
  public currentYear = new Date().getFullYear()
  public isLoading = false
  public errorMessage = ''
  public loginPassInputType = 'password'
  public useOAuth = environment.useOAuth

  constructor() {
    if (environment.useOAuth) {
      this.oauthService = inject(OAuthService)
    }
    const fb = this.fb

    this.loginForm = fb.group({
      userId: [null, Validators.required],
      password: [null, Validators.required]
    })
    if (environment.useOAuth) {
      if (environment.auth == null) {
        console.error('auth config not set but oauth=true')

        return
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true
      const result: { userId: string; password: string } = Object.assign({}, this.loginForm.value)
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
              this.snackBar.open($localize`Error logging in`, undefined, SnackbarDefaults.defaultError)
            }
          }
        })
        .add(() => {
          this.isLoading = false
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
