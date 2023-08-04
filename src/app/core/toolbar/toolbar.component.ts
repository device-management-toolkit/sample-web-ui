/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { throwError } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { AuthService } from 'src/app/auth.service'
import { AboutComponent } from '../about/about.component'
import { MpsVersion, RpsVersion } from 'src/models/models'

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  isLoggedIn = false
  public isLoading = true
  public rpsVersions?: RpsVersion
  public mpsVersions?: MpsVersion

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public authService: AuthService) {
  }

  ngOnInit (): void {
    this.isLoading = true
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
    })
    this.authService.getMPSVersion().pipe(
      catchError(err => {
        // TODO: handle error better
        this.snackBar.open($localize`Error retrieving MPS versions`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.mpsVersions = data
    })
    this.authService.getRPSVersion().pipe(
      catchError(err => {
        // TODO: handle error better
        this.snackBar.open($localize`Error retrieving RPS versions`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.rpsVersions = data
    })
  }

  logout (): void {
    this.authService.logout()
  }

  displayAbout (): void {
    this.dialog.open(AboutComponent)
  }
}
