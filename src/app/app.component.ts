/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { AuthService } from './auth.service'
import { NavFooterComponent } from './core/nav-footer/nav-footer.component'
import { NavbarComponent } from './core/navbar/navbar.component'
import { MatSidenavModule } from '@angular/material/sidenav'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { BidiModule, Direction } from '@angular/cdk/bidi'
import { getDirection } from '../utils'
import { LayoutService } from './core/layout.service'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterModule,
    NavFooterComponent,
    NavbarComponent,
    MatSidenavModule,
    BidiModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    CommonModule,
    TranslatePipe
  ]
})
export class AppComponent implements OnInit {
  // Dependency Injection
  private readonly router = inject(Router)
  private readonly authService = inject(AuthService)
  public readonly translate = inject(TranslateService)
  public readonly layout = inject(LayoutService)
  public direction = signal<Direction>('ltr')
  public canAccessApp = signal(false)
  public isHandset = this.layout.isHandset

  ngOnInit(): void {
    this.authService.canActivateProtectedRoutes$.subscribe((canAccessApp) => {
      this.canAccessApp.set(canAccessApp)
    })

    this.translate.setFallbackLang('en')
    this.setDirection(this.translate.getCurrentLang() ?? 'en')

    this.translate.onLangChange.subscribe((event) => {
      this.setDirection(event.lang)
    })
  }

  private setDirection(lang: string): void {
    this.direction.set(getDirection(lang))
  }

  onNavbarNavigate(): void {
    if (this.isHandset()) {
      this.layout.close()
    }
  }
}
