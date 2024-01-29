/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { AuthService } from '../auth.service'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { AboutComponent } from '../core/about/about.component'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public loginForm: FormGroup
  public currentYear = new Date().getFullYear()
  public isLoading = false
  public errorMessage = ''
  public loginPassInputType = 'password'
  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public router: Router, public fb: FormBuilder, public authService: AuthService) {
    this.loginForm = fb.group({
      userId: [null, Validators.required],
      password: [null, Validators.required]
    })
  }

  ngOnInit (): void {
  }

  onSubmit (): void {
    if (this.loginForm.valid) {
      this.isLoading = true
      const result: { userId: string, password: string } = Object.assign({}, this.loginForm.value)
      this.authService.login(result.userId, result.password).subscribe({
        complete: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.router.navigate([''])

          const storedValue = localStorage.getItem('doNotShowAgain')
          const doNotShowNotice = storedValue ? JSON.parse(storedValue) : false
          if (!doNotShowNotice) {
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
        next: () => {

        }
      }).add(() => {
        this.isLoading = false
      })
    }
  }

  toggleLoginPassVisibility (): void {
    this.loginPassInputType = this.loginPassInputType === 'password' ? 'text' : 'password'
  }
}
