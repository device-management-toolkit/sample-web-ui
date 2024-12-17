/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
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
    RouterLink
  ]
})
export class DashboardComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)

  public isLoading = true
  public stats?: DeviceStats
  public cloudMode = environment.cloud

  ngOnInit(): void {
    this.isLoading = true
    this.devicesService
      .getStats()
      .pipe(
        catchError((err) => {
          // TODO: handle error better
          this.snackBar.open($localize`Error retrieving device stats`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading = false
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
