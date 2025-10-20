/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { throwError } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { DeviceStats } from 'src/models/models'
import { DevicesService } from '../devices/devices.service'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { RouterLink } from '@angular/router'
import { MatIconButton } from '@angular/material/button'
import { MatTooltip } from '@angular/material/tooltip'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatCard } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { environment } from 'src/environments/environment'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    MatProgressBar,
    MatCard,
    MatIcon,
    MatDivider,
    MatTooltip,
    MatIconButton,
    RouterLink,
    TranslateModule
  ]
})
export class DashboardComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  public cloudMode = environment.cloud
  public isLoading = signal(true)
  public stats?: DeviceStats

  ngOnInit(): void {
    this.isLoading.set(true)
    this.devicesService
      .getStats()
      .pipe(
        catchError((err) => {
          // TODO: handle error better
          const msg: string = this.translate.instant('dashboard.error.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((data) => {
        this.stats = data
      })
  }

  navigateTo(url: string): void {
    window.open(url, '_blank')
  }
}
