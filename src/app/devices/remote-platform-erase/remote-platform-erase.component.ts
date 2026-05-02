/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input, computed } from '@angular/core'
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDivider } from '@angular/material/divider'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { finalize, forkJoin, throwError } from 'rxjs'
import { DevicesService } from '../devices.service'
import { AMTFeaturesRequest, AMTFeaturesResponse, BootCapabilities, RemoteEraseRequest } from '../../../models/models'
import { ParsedPlatformEraseCapability } from './remote-platform-erase.constants'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

const CSME_UNCONFIGURE_KEY = 'csmeUnconfigure'

@Component({
  selector: 'app-remote-platform-erase',
  templateUrl: './remote-platform-erase.component.html',
  styleUrl: './remote-platform-erase.component.scss',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatCheckboxModule,
    MatDivider,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MatIcon,
    MatButton,
    MatTooltipModule,
    TranslateModule
  ]
})
export class RemotePlatformEraseComponent implements OnInit {
  private readonly devicesService = inject(DevicesService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly matDialog = inject(MatDialog)
  private readonly fb = inject(FormBuilder)
  private readonly translate = inject(TranslateService)

  public readonly deviceId = input('')
  public deviceLabel = signal('')
  public isLoading = signal(true)
  public isPlatformEraseSupported = signal(false)
  public platformEraseEnabled = signal(false)
  public eraseCaps = signal<ParsedPlatformEraseCapability[]>([])
  public eraseCapsArray: FormArray<FormControl<boolean | null>> = this.fb.array<boolean>([])
  public selectedCapsCount = signal(0)
  public isCsmeExclusiveSelected = signal(false)
  public hasSelectedCaps = computed(() => this.selectedCapsCount() > 0)
  public supportedCapsCount = computed(() => this.eraseCaps().filter((c) => c.supported).length)

  private csmeIndex = -1

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
    rpeEnabled: false,
    rpeSupported: false,
    pbaBootFilesPath: [],
    winREBootFilesPath: { instanceID: '', biosBootString: '', bootString: '' }
  }

  ngOnInit(): void {
    this.devicesService.getDevice(this.deviceId()).subscribe({
      next: (device) => {
        this.deviceLabel.set(device.friendlyName || device.hostname || this.deviceId())
      }
    })
    forkJoin({
      features: this.devicesService.getAMTFeatures(this.deviceId()),
      capabilities: this.devicesService.getRemoteEraseCapabilities(this.deviceId())
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ features, capabilities }) => this.applyFeatures(features, capabilities),
        error: (err) => {
          this.snackBar.open(this.t('remotePlatformErase.errorLoad'), undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  onCapChange(): void {
    const csmeSelected = this.csmeIndex >= 0 && this.eraseCapsArray.at(this.csmeIndex)?.value === true
    if (csmeSelected) {
      this.eraseCapsArray.controls.forEach((ctrl, i) => {
        if (i !== this.csmeIndex && ctrl.value) {
          ctrl.setValue(false, { emitEvent: false })
        }
      })
    }
    this.isCsmeExclusiveSelected.set(csmeSelected)
    this.selectedCapsCount.set(this.eraseCapsArray.getRawValue().filter((v) => v === true).length)
    this.updateCapControlStates()
  }

  eraseCapControl(index: number): FormControl<boolean | null> {
    return this.eraseCapsArray.at(index) as FormControl<boolean | null>
  }

  toggleFeature(enabled: boolean): void {
    this.platformEraseEnabled.set(enabled)
    this.updateCapControlStates()
    const payload: AMTFeaturesRequest = {
      userConsent: this.amtFeatures.userConsent,
      enableKVM: this.amtFeatures.KVM,
      enableSOL: this.amtFeatures.SOL,
      enableIDER: this.amtFeatures.IDER,
      ocr: this.amtFeatures.ocr,
      platformEraseEnabled: enabled
    }
    this.isLoading.set(true)
    this.devicesService
      .setAmtFeatures(this.deviceId(), payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.amtFeatures.rpeEnabled = enabled
          this.updateCapControlStates()
        },
        error: (err) => {
          this.platformEraseEnabled.set(!enabled)
          this.updateCapControlStates()
          this.snackBar.open(this.t('remotePlatformErase.updateError'), undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  initiateErase(): void {
    if (!this.platformEraseEnabled() || !this.hasSelectedCaps()) {
      return
    }
    const operations = this.eraseCaps()
      .filter((_, i) => this.eraseCapsArray.at(i)?.value === true)
      .map((cap) => this.t(`remotePlatformErase.cap.${cap.key}.label`))
      .join(', ')

    this.matDialog
      .open(AreYouSureDialogComponent, {
        data: {
          message: 'remotePlatformErase.confirmMessage',
          params: { device: this.deviceLabel() || this.deviceId(), operations }
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === true) {
          this.executeErase()
        }
      })
  }

  private applyFeatures(features: AMTFeaturesResponse, capabilities: BootCapabilities): void {
    this.amtFeatures = features
    const supported = features.rpeSupported ?? false
    this.isPlatformEraseSupported.set(supported)
    const caps: ParsedPlatformEraseCapability[] = [
      { key: 'secureEraseSsds', supported: capabilities.secureEraseAllSSDs },
      { key: 'tpmClear', supported: capabilities.tpmClear },
      { key: 'biosRestore', supported: capabilities.restoreBIOSToEOM },
      { key: 'csmeUnconfigure', supported: capabilities.unconfigureCSME }
    ]
    this.eraseCaps.set(caps)
    this.csmeIndex = caps.findIndex((c) => c.key === CSME_UNCONFIGURE_KEY)
    this.eraseCapsArray = this.fb.array(
      caps.map((cap) => this.fb.control<boolean | null>({ value: false, disabled: !cap.supported }))
    )
    this.selectedCapsCount.set(0)
    this.isCsmeExclusiveSelected.set(false)
    this.updateCapControlStates()
  }

  private executeErase(): void {
    const caps = this.eraseCaps()
    const req: RemoteEraseRequest = {
      secureEraseAllSSDs: caps.some((c, i) => c.key === 'secureEraseSsds' && this.eraseCapsArray.at(i)?.value === true),
      tpmClear: caps.some((c, i) => c.key === 'tpmClear' && this.eraseCapsArray.at(i)?.value === true),
      restoreBIOSToEOM: caps.some((c, i) => c.key === 'biosRestore' && this.eraseCapsArray.at(i)?.value === true),
      unconfigureCSME: caps.some((c, i) => c.key === 'csmeUnconfigure' && this.eraseCapsArray.at(i)?.value === true)
    }
    this.isLoading.set(true)
    this.devicesService
      .setRemoteEraseOptions(this.deviceId(), req)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(this.t('remotePlatformErase.eraseSuccess'), undefined, SnackbarDefaults.defaultSuccess)
          this.amtFeatures.rpeEnabled = false
          this.platformEraseEnabled.set(false)
          this.eraseCapsArray.controls.forEach((c) => c.setValue(false, { emitEvent: false }))
          this.selectedCapsCount.set(0)
          this.isCsmeExclusiveSelected.set(false)
          this.updateCapControlStates()
        },
        error: (err) => {
          this.snackBar.open(this.t('remotePlatformErase.eraseError'), undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  private updateCapControlStates(): void {
    const featureEnabled = this.platformEraseEnabled()
    const csmeSelected = this.isCsmeExclusiveSelected()
    this.eraseCaps().forEach((cap, i) => {
      const ctrl = this.eraseCapsArray.at(i)
      const blockedByCsme = csmeSelected && i !== this.csmeIndex
      const shouldEnable = cap.supported && featureEnabled && !blockedByCsme
      if (shouldEnable) {
        ctrl.enable({ emitEvent: false })
      } else {
        ctrl.disable({ emitEvent: false })
      }
    })
  }

  private t(key: string): string {
    return this.translate.instant(`${key}.value`) as string
  }
}
