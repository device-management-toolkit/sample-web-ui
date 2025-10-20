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
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BidiModule, Direction } from '@angular/cdk/bidi'
import { getDirection } from 'src/utils'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterModule,
    ToolbarComponent,
    NavbarComponent,
    MatSidenavModule,
    BidiModule,
    TranslateModule
  ]
})
export class AppComponent implements OnInit {
  // Dependency Injection
  private readonly router = inject(Router)
  private readonly authService = inject(AuthService)
  public readonly translate = inject(TranslateService)
  public direction: Direction = 'ltr'
  public isLoggedIn = false

  ngOnInit(): void {
    this.authService.loggedInSubject$.subscribe((value: any) => {
      this.isLoggedIn = value
    })

    this.translate.setFallbackLang('en')
    this.setDirection(this.translate.getCurrentLang())

    this.translate.onLangChange.subscribe((event) => {
      this.setDirection(event.lang)
    })
  }

  private setDirection(lang: string): void {
    this.direction = getDirection(lang)
  }
}
