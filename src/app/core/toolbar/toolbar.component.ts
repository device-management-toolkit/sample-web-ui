/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AuthService } from 'src/app/auth.service'
import { AboutComponent } from '../about/about.component'
import { MpsVersion, RpsVersion } from 'src/models/models'
import { environment } from 'src/environments/environment'
import { MatIcon } from '@angular/material/icon'
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu'
import { MatIconButton } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatToolbar } from '@angular/material/toolbar'

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    standalone: true,
    imports: [MatToolbar, MatDivider, MatIconButton, MatMenuTrigger, MatIcon, MatMenu, MatMenuItem]
})
export class ToolbarComponent implements OnInit {
  isLoggedIn = false
  cloudMode: boolean = environment.cloud
  public rpsVersions?: RpsVersion
  public mpsVersions?: MpsVersion

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public authService: AuthService) {
  }

  ngOnInit (): void {
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
      if (this.isLoggedIn && environment.cloud) {
        this.authService.getMPSVersion().subscribe({
          error: () => {
            this.snackBar.open($localize`Error retrieving MPS versions`, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
           this.mpsVersions = data
          }
        })
        this.authService.getRPSVersion().subscribe({
          error: () => {
            this.snackBar.open($localize`Error retrieving RPS versions`, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
           this.rpsVersions = data
          }
        })
      }
    })
  }

  logout (): void {
    this.authService.logout()
  }

  displayAbout (): void {
    this.dialog.open(AboutComponent)
  }
}
