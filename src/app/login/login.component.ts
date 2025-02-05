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
    MatCardFooter
  ]
})
export class LoginComponent {
  snackBar = inject(MatSnackBar)
  dialog = inject(MatDialog)
  router = inject(Router)
  fb = inject(FormBuilder)
  authService = inject(AuthService)

  public loginForm: FormGroup
  public currentYear = new Date().getFullYear()
  public isLoading = false
  public errorMessage = ''
  public loginPassInputType = 'password'
  constructor() {
    const fb = this.fb

    this.loginForm = fb.group({
      userId: [null, Validators.required],
      password: [null, Validators.required]
    })
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true
      const result: { userId: string; password: string } = Object.assign({}, this.loginForm.value)
      this.authService
        .login(result.userId, result.password)
        .subscribe({
          complete: () => {
            this.router.navigate([''])

            const storedValue = localStorage.getItem('doNotShowAgain')
            const doNotShowNotice = storedValue ? JSON.parse(storedValue) : false
            if (!doNotShowNotice && environment.cloud) {
              this.dialog.open(AboutComponent)
            }
          },
          error: (err) => {
            if (err.status === 405 || err.status === 401) {
              this.snackBar.open($localize`${err.error.message}`, undefined, SnackbarDefaults.defaultError)
            } else {
              this.snackBar.open($localize`Error logging in`, undefined, SnackbarDefaults.defaultError)
            }
          },
          next: () => {}
        })
        .add(() => {
          this.isLoading = false
        })
    }
  }

  toggleLoginPassVisibility(): void {
    this.loginPassInputType = this.loginPassInputType === 'password' ? 'text' : 'password'
  }
}
