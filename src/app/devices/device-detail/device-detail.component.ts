/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { throwError } from 'rxjs'
import { finalize } from 'rxjs/operators'
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
  public amtVersion: any
  public amtFeatures: AmtFeaturesResponse = { KVM: false, SOL: false, IDER: false, redirection: false, optInState: 0, userConsent: 'none' }
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
  public amtEnabledFeatures: FormGroup
  constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService, public fb: FormBuilder) {
    this.targetOS = this.devicesService.TargetOSMap
    this.amtEnabledFeatures = fb.group({
      enableIDER: false,
      enableKVM: false,
      enableSOL: false,
      userConsent: 'none',
      optInState: 0,
      redirection: false
    })
  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
      const tempLoading = [true, true, true]
      this.devicesService.getAMTVersion(this.deviceId).pipe(finalize(() => {
        tempLoading[0] = false
        this.isLoading = !tempLoading.every(v => !v)
      })).subscribe(results => {
        this.amtVersion = results
      }, err => {
        this.snackBar.open($localize`Error retrieving AMT Version`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      })
      this.devicesService.getHardwareInformation(this.deviceId).pipe(finalize(() => {
        tempLoading[0] = false
        this.isLoading = !tempLoading.every(v => !v)
      })).subscribe(results => {
        this.hwInfo = results
      }, err => {
        this.snackBar.open($localize`Error retrieving HW Info`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      })
      this.devicesService.getAuditLog(this.deviceId).pipe(finalize(() => {
        tempLoading[1] = false
        this.isLoading = !tempLoading.every(v => !v)
      })).subscribe(results => {
        this.auditLogData = results
      }, err => {
        this.snackBar.open($localize`Error retrieving Audit Log`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      })
      this.devicesService.getAMTFeatures(this.deviceId).pipe(finalize(() => {
        tempLoading[2] = false
        this.isLoading = !tempLoading.every(v => !v)
      })).subscribe(results => {
        this.amtEnabledFeatures = this.fb.group({
          enableIDER: results.IDER,
          enableKVM: results.KVM,
          enableSOL: results.SOL,
          userConsent: results.userConsent,
          optInState: results.optInState,
          redirection: results.redirection
        })
      }, err => {
        this.snackBar.open($localize`Error retrieving AMT Features`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      })
    })
  }

  setAmtFeatures (): void {
    this.isLoading = true
    this.devicesService.setAmtFeatures(this.deviceId, this.amtEnabledFeatures.value).pipe(finalize(() => {
      this.isLoading = false
    })).subscribe((results: any) => {
      this.snackBar.open($localize`${results.status}`, undefined, SnackbarDefaults.defaultSuccess)
    })
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${this.deviceId}/${path}`])
  }

  parseProvisioningMode (mode: number): string {
    switch (mode) {
      case 1:
        return 'Admin Control Mode (ACM)'
      case 4:
        return 'Client Control Mode (CCM)'
      default:
        return 'Unknown'
    }
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
