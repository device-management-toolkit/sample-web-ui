/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSelectModule } from '@angular/material/select'
import { AMTFeaturesRequest, AMTFeaturesResponse, Device, HardwareInformation } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { catchError, finalize, forkJoin, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatProgressBar } from '@angular/material/progress-bar'
import { environment } from 'src/environments/environment'
import { MatTooltip } from '@angular/material/tooltip'

@Component({
  selector: 'app-general',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly fb = inject(FormBuilder)

  public readonly deviceId = input('')

  public amtFeatures: AMTFeaturesResponse = {
    KVM: false,
    SOL: false,
    IDER: false,
    kvmAvailable: false,
    redirection: false,
    optInState: 0,
    userConsent: 'none',
    ocr: false,
    httpsBootSupported: false,
    winREBootSupported: false,
    localPBABootSupported: false,
    remoteErase: false
  }
  public hwInfo?: HardwareInformation
  public isDisabled = true
  public isKVMDisabled = false
  public amtEnabledFeatures = this.fb.group({
    enableIDER: false,
    enableKVM: [{ value: false, disabled: this.isKVMDisabled }],
    enableSOL: false,
    userConsent: [{ value: 'none', disabled: this.isDisabled }],
    optInState: 0,
    redirection: false,
    httpsBootSupported: false,
    winREBootSupported: false,
    localPBABootSupported: false
  })

  public isLoading = signal(true)
  public amtDHCPDNSSuffix: string | null = null
  public amtTrustedDNSSuffix: string | null = null
  public amtVersion: string | null = null
  public amtBuild: string | null = null
  public amtSKU: string | null = null
  public amtProvisioningMode: string | null = null
  public cloudMode = environment.cloud
  public device: Device | null = null
  public userConsentValues = [
    'none',
    'kvm',
    'all'
  ]
  public generalSettings: any = {}
  public isCloudMode: boolean = environment.cloud

  ngOnInit(): void {
    forkJoin({
      amtFeatures: this.devicesService.getAMTFeatures(this.deviceId()).pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving AMT Features`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        })
      ),
      generalSettings: this.devicesService.getGeneralSettings(this.deviceId()).pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving General Settings`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        })
      ),
      amtVersion: this.devicesService.getAMTVersion(this.deviceId()).pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving AMT Version`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        })
      )
    })
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((results) => {
        this.amtDHCPDNSSuffix = results.amtVersion?.AMT_SetupAndConfigurationService?.response.DhcpDNSSuffix ?? ''
        this.amtTrustedDNSSuffix = results.amtVersion?.AMT_SetupAndConfigurationService?.response.TrustedDNSSuffix ?? ''
        this.amtVersion = results.amtVersion?.CIM_SoftwareIdentity?.responses[10].VersionString ?? ''
        this.amtBuild = results.amtVersion?.CIM_SoftwareIdentity?.responses[6].VersionString ?? ''
        this.amtSKU = this.skuLookup(results.amtVersion?.CIM_SoftwareIdentity?.responses[4].VersionString ?? '')
        this.amtProvisioningMode = this.parseProvisioningMode(
          results.amtVersion?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode ?? 0
        )
        this.generalSettings = results.generalSettings
        this.isKVMDisabled = !(results.amtFeatures.kvmAvailable ?? true)
        this.isDisabled = results.amtVersion?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode !== 1
        this.amtEnabledFeatures = this.fb.group({
          enableIDER: results.amtFeatures.IDER,
          enableKVM: [{ value: results.amtFeatures.KVM, disabled: this.isKVMDisabled }],
          enableSOL: results.amtFeatures.SOL,
          userConsent: [{ value: results.amtFeatures.userConsent, disabled: this.isDisabled }],
          optInState: results.amtFeatures.optInState,
          redirection: results.amtFeatures.redirection,
          httpsBootSupported: [
            {
              value: results.amtFeatures.ocr && results.amtFeatures.httpsBootSupported,
              disabled: !results.amtFeatures.httpsBootSupported
            }
          ],
          winREBootSupported: results.amtFeatures.winREBootSupported,
          localPBABootSupported: results.amtFeatures.localPBABootSupported
        })
      })
  }

  setAmtFeatures(): void {
    this.isLoading.set(true)
    this.devicesService
      .setAmtFeatures(this.deviceId(), this.amtEnabledFeatures.value as AMTFeaturesRequest)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (results) => {
          if (this.cloudMode) {
            this.snackBar.open($localize`${(results as any).status}`, undefined, SnackbarDefaults.defaultSuccess)
          } else {
            this.snackBar.open($localize`AMT Features updated`, undefined, SnackbarDefaults.defaultSuccess)
          }
        },
        error: (err) => {
          this.snackBar.open($localize`Failed to update AMT Features`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }
      })
  }

  parseProvisioningMode(mode: number): string {
    switch (mode) {
      case 1:
        return 'Admin Control Mode (ACM)'
      case 4:
        return 'Client Control Mode (CCM)'
      default:
        return 'Unknown'
    }
  }

  skuLookup(sku: string): string {
    switch (sku) {
      case '16400':
        return 'Intel® Standard Manageability'
      case '16392':
        return 'Intel® Active Management Technology'
      default:
        return sku
    }
  }
}
