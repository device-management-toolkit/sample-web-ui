/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnDestroy, OnInit, inject, signal, input } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSelectModule } from '@angular/material/select'
import { AMTFeaturesRequest, AMTFeaturesResponse, Device, HardwareInformation } from '../../../models/models'
import { DevicesService } from '../devices.service'
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { catchError, finalize, forkJoin, Subject, takeUntil, throwError } from 'rxjs'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatProgressBar } from '@angular/material/progress-bar'
import { environment } from '../../../environments/environment'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-general',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    TranslateModule,
    MatIcon,
    MatButton
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements OnInit, OnDestroy {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly fb = inject(FormBuilder)
  private readonly translate = inject(TranslateService)

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
    rpeSupported: false,
    rpeEnabled: false,
    pbaBootFilesPath: [],
    winREBootFilesPath: { instanceID: '', biosBootString: '', bootString: '' }
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
    localPBABootSupported: false,
    ocr: false,
    platformEraseEnabled: false,
    rpeSupported: false
  })

  public isLoading = signal(true)
  public isDataLoaded = signal(false)
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

  private readonly destroy$ = new Subject<void>()

  ngOnInit(): void {
    forkJoin({
      // Reuses the toolbar's in-flight / cached features fetch so device-detail
      // entry costs one /features round-trip total, not two.
      amtFeatures: this.devicesService.getAMTFeaturesCached(this.deviceId()).pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('general.errorAMTFeatures.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        })
      ),
      generalSettings: this.devicesService.getGeneralSettings(this.deviceId()).pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('general.errorGeneralSettings.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        })
      ),
      amtVersion: this.devicesService.getAMTVersion(this.deviceId()).pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('general.errorAMTVersion.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        })
      )
    })
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        }),
        takeUntil(this.destroy$)
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
          ocr: [
            {
              value: results.amtFeatures.ocr,
              disabled:
                !results.amtFeatures.httpsBootSupported &&
                !results.amtFeatures.winREBootSupported &&
                !results.amtFeatures.localPBABootSupported
            }
          ],
          httpsBootSupported: [{ value: results.amtFeatures.httpsBootSupported, disabled: true }],
          winREBootSupported: [{ value: results.amtFeatures.winREBootSupported, disabled: true }],
          localPBABootSupported: [{ value: results.amtFeatures.localPBABootSupported, disabled: true }],
          platformEraseEnabled: [
            {
              value: results.amtFeatures.rpeEnabled,
              disabled: !(results.amtFeatures.rpeSupported ?? false)
            }
          ],
          rpeSupported: [{ value: results.amtFeatures.rpeSupported ?? false, disabled: true }]
        })
        this.isDataLoaded.set(true)
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  get isRedirectionRequired(): boolean {
    const enableKVM = this.amtEnabledFeatures.get('enableKVM')?.value
    const enableSOL = this.amtEnabledFeatures.get('enableSOL')?.value
    const enableIDER = this.amtEnabledFeatures.get('enableIDER')?.value
    // coerce nullable form values to boolean
    return !!(enableKVM || enableSOL || enableIDER)
  }

  setAmtFeatures(): void {
    this.isLoading.set(true)
    this.devicesService
      .setAmtFeatures(this.deviceId(), {
        ...this.amtEnabledFeatures.getRawValue()
      } as AMTFeaturesRequest)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (results) => {
          if (results.redirection != null) {
            this.amtEnabledFeatures.patchValue({
              redirection: results.redirection
            })
          }
          if (this.cloudMode) {
            this.snackBar.open($localize`${(results as any).status}`, undefined, SnackbarDefaults.defaultSuccess)
          } else {
            const msg: string = this.translate.instant('general.AMTFeatures.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
          }
        },
        error: (err) => {
          const msg: string = this.translate.instant('general.failAMTFeatures.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }
      })
  }

  parseProvisioningMode(mode: number): string {
    switch (mode) {
      case 1:
        return 'profileDetail.activationModeAdmin.value'
      case 4:
        return 'profileDetail.activationModeClient.value'
      default:
        return 'common.unknown.value'
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
