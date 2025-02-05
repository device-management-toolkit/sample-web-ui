/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AuthService } from 'src/app/auth.service'
import { AboutComponent } from '../about/about.component'
import { MPSVersion, RPSVersion } from 'src/models/models'
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
  imports: [
    MatToolbar,
    MatDivider,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem
  ]
})
export class ToolbarComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  dialog = inject(MatDialog)
  authService = inject(AuthService)

  isLoggedIn = false
  cloudMode: boolean = environment.cloud
  public rpsVersions?: RPSVersion
  public mpsVersions?: MPSVersion

  ngOnInit(): void {
    this.authService.loggedInSubject$.subscribe((value: any) => {
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
      } else if (this.isLoggedIn && !environment.cloud) {
        this.authService.getConsoleVersion().subscribe({
          error: () => {
            // this.snackBar.open($localize`Error retrieving console version`, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
            if (data.current !== 'DEVELOPMENT') {
              if (this.authService.compareSemver(data.current as string, data.latest.tag_name as string) === -1) {
                const ref = this.snackBar.open(
                  'A new version of console is available!',
                  'Download',
                  SnackbarDefaults.longSuccess
                )
                ref.onAction().subscribe(() => {
                  window.open(data.latest.html_url as string)
                })
              }
            }
          }
        })
      }
    })
  }

  logout(): void {
    this.authService.logout()
  }

  displayAbout(): void {
    this.dialog.open(AboutComponent)
  }
}
