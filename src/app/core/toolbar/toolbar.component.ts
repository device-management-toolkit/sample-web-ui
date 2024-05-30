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

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
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
      } else if (this.isLoggedIn && !environment.cloud) {
        this.authService.getConsoleVersion().subscribe({
          error: () => {
            // this.snackBar.open($localize`Error retrieving console version`, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
            if (data.current !== 'DEVELOPMENT') {
              if (this.authService.compareSemver(data.current as string, data.latest.tag_name as string) === -1) {
                const ref = this.snackBar.open('A new version of console is available!', 'Download', SnackbarDefaults.longSuccess)
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

  logout (): void {
    this.authService.logout()
  }

  displayAbout (): void {
    this.dialog.open(AboutComponent)
  }
}
