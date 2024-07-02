/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, Input, OnInit } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSelectModule } from '@angular/material/select'
import { ActivatedRoute, Router } from '@angular/router'
import { AmtFeaturesRequest, AmtFeaturesResponse, Device, HardwareInformation } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { catchError, finalize, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [MatCardModule, MatSelectModule, MatCheckboxModule, FormsModule, ReactiveFormsModule],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements OnInit {
  @Input()
  public deviceId = ''

  public amtFeatures: AmtFeaturesResponse = { KVM: false, SOL: false, IDER: false, redirection: false, optInState: 0, userConsent: 'none' }
  public hwInfo?: HardwareInformation
  public amtEnabledFeatures: FormGroup
  public isLoading = true
  public isDisabled = true
  public amtVersion: any
  public device: Device | null = null
  public userConsentValues = ['none', 'kvm', 'all']
  public generalSettings: any = {}

  constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService, public fb: FormBuilder) {
    this.amtEnabledFeatures = fb.group({
      enableIDER: false,
      enableKVM: false,
      enableSOL: false,
      userConsent: [{ value: 'none', disabled: this.isDisabled }],
      optInState: 0,
      redirection: false
    })
  }

  ngOnInit (): void {
    this.devicesService.getAMTFeatures(this.deviceId).pipe(
      catchError(err => {
        this.snackBar.open($localize`Error retrieving AMT Features`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe((results) => {
      this.amtEnabledFeatures = this.fb.group({
        enableIDER: results.IDER,
        enableKVM: results.KVM,
        enableSOL: results.SOL,
        userConsent: results.userConsent,
        optInState: results.optInState,
        redirection: results.redirection
      })
    })
    this.devicesService.getGeneralSettings(this.deviceId).subscribe((data: any) => {
      this.generalSettings = data
      this.isLoading = false
    })
    this.devicesService.getAMTVersion(this.deviceId).pipe(
      catchError(err => {
        this.snackBar.open($localize`Error retrieving AMT Version`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe((results) => {
      this.amtVersion = results
      this.isDisabled = results?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode === 4
    })
  }

  setAmtFeatures (): void {
    this.isLoading = true
    this.devicesService.setAmtFeatures(this.deviceId, this.amtEnabledFeatures.value as AmtFeaturesRequest).pipe(finalize(() => {
      this.isLoading = false
    })).subscribe((results: any) => {
      this.snackBar.open($localize`${results.status}`, undefined, SnackbarDefaults.defaultSuccess)
    }, err => {
      this.snackBar.open($localize`Failed to update AMT Features`, undefined, SnackbarDefaults.defaultError)
      return throwError(err)
    })
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
}
