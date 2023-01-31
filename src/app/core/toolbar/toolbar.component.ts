/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { AuthService } from 'src/app/auth.service'
import { AboutComponent } from '../about/about.component'

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  isLoggedIn = false

  constructor (public dialog: MatDialog, public authService: AuthService) {
  }

  ngOnInit (): void {
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
    })
  }

  logout (): void {
    this.authService.logout()
  }

  displayAbout (): void {
    this.dialog.open(AboutComponent)
  }
}
