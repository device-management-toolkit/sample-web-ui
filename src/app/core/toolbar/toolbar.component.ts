/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/auth.service'

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  isLoggedIn = false

  constructor (public router: Router, public authService: AuthService) {
  }

  ngOnInit (): void {
    this.authService.loggedInSubject.subscribe((value: any) => {
      this.isLoggedIn = value
    })
  }

  async logout (): Promise<void> {
    this.authService.logout()
    await this.router.navigate(['/login'])
  }
}
