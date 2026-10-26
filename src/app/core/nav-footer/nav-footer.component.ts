/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'

import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AuthService } from '../../auth.service'
import { Palette, ThemeMode, ThemeService, palettes, themeModes } from '../../theme.service'
import { AboutComponent } from '../about/about.component'
import { MPSVersion, RPSVersion, ConsoleVersion } from '../../../models/models'
import { environment } from '../../../environments/environment'
import { MatIcon } from '@angular/material/icon'
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu'
import { MatIconButton } from '@angular/material/button'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { availableLangs } from '../../../constants'
import { getDirection } from '../../../utils'

@Component({
  selector: 'app-nav-footer',
  templateUrl: './nav-footer.component.html',
  styleUrls: ['./nav-footer.component.scss'],
  imports: [
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    TranslatePipe
  ]
})
export class NavFooterComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)
  public readonly authService = inject(AuthService)
  public readonly themeService = inject(ThemeService)
  private readonly translate = inject(TranslateService)

  public isLoggedIn = signal(false)
  public cloudMode: boolean = environment.cloud
  public canAccessApp = signal(false)
  public rpsVersions = signal<RPSVersion>({} as RPSVersion)
  public mpsVersions = signal<MPSVersion>({} as MPSVersion)
  public consoleVersion = signal<ConsoleVersion>({} as ConsoleVersion)

  public get availableLangs() {
    return availableLangs
  }

  public readonly themeModes = themeModes
  public readonly modeIcons: Record<ThemeMode, string> = {
    system: 'brightness_auto',
    light: 'light_mode',
    dark: 'dark_mode'
  }
  public readonly modeLabels: Record<ThemeMode, string> = {
    system: 'toolbar.theme.system.value',
    light: 'toolbar.theme.light.value',
    dark: 'toolbar.theme.dark.value'
  }

  public readonly palettes = palettes
  public readonly paletteLabels: Record<Palette, string> = {
    azure: 'toolbar.palette.azure.value',
    rose: 'toolbar.palette.rose.value',
    magenta: 'toolbar.palette.magenta.value',
    cyan: 'toolbar.palette.cyan.value'
  }

  ngOnInit(): void {
    this.authService.loggedInSubject$.subscribe((value: any) => {
      this.isLoggedIn.set(value)
    })
    this.authService.canActivateProtectedRoutes$.subscribe((value) => {
      this.canAccessApp.set(value)
      if (value && environment.cloud) {
        this.authService.getMPSVersion().subscribe({
          error: () => {
            const msg: string = this.translate.instant('toolbar.errorMPS.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
            this.mpsVersions.set(data)
          }
        })
        this.authService.getRPSVersion().subscribe({
          error: () => {
            const msg: string = this.translate.instant('toolbar.errorRPS.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
            this.rpsVersions.set(data)
          }
        })
      } else if (value && !environment.cloud) {
        this.authService.getConsoleVersion().subscribe({
          error: () => {
            // this.snackBar.open($localize`Error retrieving console version`, undefined, SnackbarDefaults.defaultError)
          },
          next: (data) => {
            // Store console version data including tag_name
            this.consoleVersion.set(data)
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
  switchLang(lang: string): void {
    this.translate.use(lang)
    localStorage.setItem('lang', lang)
    document.documentElement.setAttribute('dir', getDirection(lang))
    document.documentElement.setAttribute('lang', lang)
  }
}
