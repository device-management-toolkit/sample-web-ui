/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnDestroy, OnInit, inject, signal, input } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import { catchError, finalize, Subject, takeUntil, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { CIMProcessor, DiskInformation, HardwareInformation } from 'src/models/models'
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
export class HardwareInformationComponent implements OnInit, OnDestroy {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  public readonly deviceId = input('')
  private readonly destroy$ = new Subject<void>()

  public isHwLoading = signal(true)
  public isDiskLoading = signal(false)
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
          this.isHwLoading.set(false)
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((results) => {
        this.hwInfo = results
        if (!this.isCloudMode) {
          this.getDiskInformation()
        }
      })
  }

  getDiskInformation(): void {
    this.isDiskLoading.set(true)
    this.devicesService
      .getDiskInformation(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('hwInfo.errorRetrievingAdditional.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isDiskLoading.set(false)
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((diskInfo) => {
        this.diskInfo = diskInfo
      })
  }

  getProcessorForChip(tag: string): CIMProcessor | undefined {
    return this.hwInfo?.CIM_Processor?.responses?.find((p: CIMProcessor) => p.DeviceID === tag)
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  calculateMediaSize(maxMediaSize: number): string {
    const sizeInMB = (maxMediaSize / (1000 * 1000)).toFixed(0)
    return `${sizeInMB} GB`
  }
}
