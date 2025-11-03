/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { catchError, finalize, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { DiskInformation, HardwareInformation } from 'src/models/models'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBar } from '@angular/material/progress-bar'
import { environment } from 'src/environments/environment'
import { AmDateFormatterPipe } from '../../shared/pipes/date-formatter.pipe.ts.pipe'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-hardware-information',
  imports: [
    MatProgressBar,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    AmDateFormatterPipe,
    TranslateModule
  ],
  templateUrl: './hardware-information.component.html',
  styleUrl: './hardware-information.component.scss'
})
export class HardwareInformationComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  public readonly deviceId = input('')

  public isLoading = signal(true)
  public hwInfo?: HardwareInformation
  public diskInfo?: DiskInformation
  public targetOS: any
  public memoryType: any
  public isCloudMode: boolean = environment.cloud

  constructor() {
    this.targetOS = this.devicesService.TargetOSMap
    this.memoryType = this.devicesService.MemoryTypeMap
  }

  ngOnInit(): void {
    this.devicesService
      .getHardwareInformation(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('hwInfo.errorRetrievingHW.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((results) => {
        this.hwInfo = results
        if (!this.isCloudMode) {
          this.getDiskInformation()
        }
      })
  }

  getDiskInformation(): void {
    this.devicesService
      .getDiskInformation(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('hwInfo.errorRetrievingAdditional.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((diskInfo) => {
        this.diskInfo = diskInfo
      })
  }

  calculateMediaSize(maxMediaSize: number): string {
    const sizeInMB = (maxMediaSize / (1000 * 1000)).toFixed(0)
    return `${sizeInMB} GB`
  }
}
