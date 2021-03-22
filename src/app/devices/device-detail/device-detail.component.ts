/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { forkJoin, throwError } from 'rxjs'

import { catchError, finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AmtFeaturesResponse, AuditLogResponse, HardwareInformation } from 'src/models/models'
import { DevicesService } from '../devices.service'

@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.component.html',
  styleUrls: ['./device-detail.component.scss']
})
export class DeviceDetailComponent implements OnInit {
  public auditLogData: AuditLogResponse = { totalCnt: 0, records: [] }
  public hwInfo?: HardwareInformation
  public amtFeatures?: AmtFeaturesResponse
  public isLoading = false
  public deviceId: string = ''
  public targetOS: any
  public powerOptions = [
    {
      label: 'Hibernate',
      action: 7
    }, {
      label: 'Sleep',
      action: 4
    }, {
      label: 'Reset',
      action: 10
    }, {
      label: 'Soft-Off',
      action: 12
    }, {
      label: 'Soft Reset',
      action: 14
    }, {
      label: 'Reset to BIOS',
      action: 101
    }, {
      label: 'Power Up to BIOS',
      action: 100
    }, {
      label: 'Reset to PXE',
      action: 400
    }, {
      label: 'Power Up to PXE',
      action: 401
    }
  ]

  public showSol: boolean = false
  public selectedAction: string = ''
  public deviceState: number = 0
  constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService) {
    this.targetOS = this.devicesService.TargetOSMap
  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
      const hwInfo = this.devicesService.getHardwareInformation(this.deviceId)
      const auditInfo = this.devicesService.getAuditLog(this.deviceId)
      const amtFeatures = this.devicesService.getAMTFeatures(this.deviceId)
      return forkJoin({ hwInfo, auditInfo, amtFeatures }).pipe(
        catchError(err => {
          // TODO: handle error better
          console.log(err)
          this.snackBar.open($localize`Error retrieving audit log`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }), finalize(() => {
          this.isLoading = false
        })
      ).subscribe((results) => {
        this.hwInfo = results.hwInfo
        this.auditLogData = results.auditInfo
        this.amtFeatures = results.amtFeatures
      })
    })
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${this.deviceId}/${path}`])
  }

  onSelectAction = (): void => {
    this.showSol = !this.showSol
  }

  deviceStatus = (state: number): void => {
    this.deviceState = state
  }

  onSelectedAction = (selectedAction: string): void => {
    this.selectedAction = selectedAction
  }
}
