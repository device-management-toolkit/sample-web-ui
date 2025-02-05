/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { AuthService } from './auth.service'
import { ToolbarComponent } from './core/toolbar/toolbar.component'
import { NavbarComponent } from './core/navbar/navbar.component'
import { MatSidenavModule } from '@angular/material/sidenav'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterModule,
    ToolbarComponent,
    NavbarComponent,
    MatSidenavModule
  ]
})
export class AppComponent implements OnInit {
  router = inject(Router)
  authService = inject(AuthService)

  isLoggedIn = false

  ngOnInit(): void {
    this.authService.loggedInSubject$.subscribe((value: any) => {
      this.isLoggedIn = value
    })
  }
}
