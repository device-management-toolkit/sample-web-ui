/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input, computed } from '@angular/core'
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { MatToolbar } from '@angular/material/toolbar'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { finalize, throwError } from 'rxjs'
import { DevicesService } from '../devices.service'
import { AMTFeaturesRequest, AMTFeaturesResponse } from 'src/models/models'
import {
  ParsedPlatformEraseCapability,
  parsePlatformEraseCaps,
  PLATFORM_ERASE_CAPABILITIES
} from './remote-platform-erase.constants'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AreYouSureDialogComponent } from 'src/app/shared/are-you-sure/are-you-sure.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-remote-platform-erase',
  templateUrl: './remote-platform-erase.component.html',
  styleUrl: './remote-platform-erase.component.scss',
  imports: [
    MatToolbar,
    MatProgressBar,
    MatCardModule,
    MatCheckboxModule,
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
  public isLoading = signal(true)
  public isPlatformEraseSupported = signal(false)
  public platformEraseEnabled = signal(false)
  public featureEnabledControl = this.fb.control<boolean>(false)
  public eraseCaps = signal<ParsedPlatformEraseCapability[]>([])
  public eraseCapsArray: FormArray<FormControl<boolean | null>> = this.fb.array<boolean>([])
  public selectedCapsCount = signal(0)
  public hasSelectedCaps = computed(() => this.selectedCapsCount() > 0)

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
    rpeCaps: 0,
    pbaBootFilesPath: [],
    winREBootFilesPath: { instanceID: '', biosBootString: '', bootString: '' }
  }

  ngOnInit(): void {
    this.devicesService
      .getAMTFeatures(this.deviceId())
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (features) => {
          this.amtFeatures = features
          const supported = features.rpeSupported ?? false
          this.isPlatformEraseSupported.set(supported)
          const allCapsBitmask = PLATFORM_ERASE_CAPABILITIES.reduce((acc, cap) => acc | cap.bit, 0)
          const rawCaps = features.rpeCaps ?? 0
          const capsBitmask = supported && rawCaps === 0 ? allCapsBitmask : rawCaps
          const caps = parsePlatformEraseCaps(capsBitmask)
          this.eraseCaps.set(caps)
          this.eraseCapsArray = this.fb.array(
            caps.map((cap) => this.fb.control<boolean | null>({ value: false, disabled: !cap.supported }))
          )
          this.selectedCapsCount.set(0)
          this.updateCapControlStates()
        },
        error: (err) => {
          const msg: string = this.translate.instant('remotePlatformErase.errorLoad.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  onCapChange(): void {
    this.updateCapControlStates()
    this.selectedCapsCount.set(this.eraseCapsArray.getRawValue().filter((v) => v === true).length)
  }

  eraseCapControl(index: number): FormControl<boolean | null> {
    return this.eraseCapsArray.at(index) as FormControl<boolean | null>
  }

  toggleFeature(enabled: boolean): void {
    this.platformEraseEnabled.set(enabled)
    this.featureEnabledControl.setValue(enabled, { emitEvent: false })
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
          this.featureEnabledControl.setValue(!enabled, { emitEvent: false })
          const msg: string = this.translate.instant('remotePlatformErase.updateError.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  private updateCapControlStates(): void {
    const featureEnabled = this.platformEraseEnabled()
    this.eraseCaps().forEach((cap, i) => {
      const ctrl = this.eraseCapsArray.at(i)
      if (!cap.supported || !featureEnabled) {
        ctrl.disable({ emitEvent: false })
      } else {
        ctrl.enable({ emitEvent: false })
      }
    })
  }

  initiateErase(): void {
    if (!this.platformEraseEnabled() || !this.hasSelectedCaps()) {
      return
    }
    const dialogRef = this.matDialog.open(AreYouSureDialogComponent, {
      data: { message: 'remotePlatformErase.confirmMessage' }
    })
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        const eraseMask = PLATFORM_ERASE_CAPABILITIES.reduce(
          (acc, cap, i) => ((this.eraseCapsArray.at(i)?.value ?? false) ? acc | cap.bit : acc),
          0
        )
        this.isLoading.set(true)
        this.devicesService
          .sendRemotePlatformErase(this.deviceId(), eraseMask)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: () => {
              const msg: string = this.translate.instant('remotePlatformErase.eraseSuccess.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
              this.amtFeatures.rpeEnabled = false
              this.platformEraseEnabled.set(false)
              this.featureEnabledControl.setValue(false, { emitEvent: false })
              this.eraseCapsArray.controls.forEach((c) => c.setValue(false, { emitEvent: false }))
              this.selectedCapsCount.set(0)
              this.updateCapControlStates()
            },
            error: (err) => {
              const msg: string = this.translate.instant('remotePlatformErase.eraseError.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
              return throwError(() => err)
            }
          })
      }
    })
  }
}
