/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, DestroyRef, OnInit, inject, signal, input, computed } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { catchError, switchMap } from 'rxjs/operators'
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDivider } from '@angular/material/divider'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { filter, finalize, forkJoin, Observable, of, EMPTY } from 'rxjs'
import { DevicesService } from '../devices.service'
import { UserConsentService } from '../user-consent.service'
import {
  AMTFeaturesRequest,
  AMTFeaturesResponse,
  PowerState,
  BootCapabilities,
  RemoteEraseRequest,
  UserConsentResponse
} from '../../../models/models'
import { ParsedPlatformEraseCapability } from './remote-platform-erase.constants'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { PowerUpAlertComponent } from '../../shared/power-up-alert/power-up-alert.component'

const CSME_UNCONFIGURE_KEY = 'csmeUnconfigure'
const SSD_ERASE_KEY = 'secureEraseSsds'

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
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ]
})
export class RemotePlatformEraseComponent implements OnInit {
  private readonly devicesService = inject(DevicesService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly destroyRef = inject(DestroyRef)
  private readonly matDialog = inject(MatDialog)
  private readonly fb = inject(FormBuilder)
  private readonly translate = inject(TranslateService)
  private readonly router = inject(Router)
  private readonly userConsentService = inject(UserConsentService)

  public deviceConnection = signal(false)

  public readonly deviceId = input('')
  public deviceLabel = signal('')
  public isLoading = signal(false)
  public powerState: PowerState = { powerstate: 0 }
  public isPlatformEraseSupported = signal(false)
  public platformEraseEnabled = signal(false)
  public eraseCaps = signal<ParsedPlatformEraseCapability[]>([])
  public eraseCapsArray: FormArray<FormControl<boolean | null>> = this.fb.array<boolean>([])
  public selectedCapsCount = signal(0)
  public isCsmeExclusiveSelected = signal(false)
  public hasSelectedCaps = computed(() => this.selectedCapsCount() > 0)
  public supportedCapsCount = computed(() => this.eraseCaps().filter((c) => c.supported).length)
  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  private csmeIndex = -1
  private ssdIndex = -1
  public isSsdSelected = signal(false)
  public readyToErase = false
  public isSsdEncrypted = signal(false)
  public ssdEncryptedControl = this.fb.control<boolean | null>(false)
  public ssdPasswordControl = this.fb.control<string | null>('')

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
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          const msg: string = err.error?.message || this.t('remotePlatformErase.errorLoad')
          this.displayError(msg)
          return EMPTY
        })
      )
      .subscribe({
        next: ({ features, capabilities }) => this.applyFeatures(features, capabilities)
      })

    // Reactively update the slider whenever features change (e.g. after General tab saves)
    this.devicesService
      .featuresChanges(this.deviceId())
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((features) => {
        this.isPlatformEraseSupported.set(features.rpeSupported ?? false)
        this.platformEraseEnabled.set(features.rpe ?? false)
        this.amtFeatures.set(features)
        this.updateCapControlStates()
      })
  }

  init(): void {
    this.isLoading.set(true)
    // device needs to be powered on in order to perform RPE
    this.getPowerState(this.deviceId())
      .pipe(switchMap((powerState) => this.handlePowerState(powerState)))
      .subscribe()
      .add(() => this.isLoading.set(false))
  }

  handlePowerState(powerState: PowerState): Observable<any> {
    this.powerState = powerState
    // If device is not powered on, shows alert to power up device
    if (this.powerState.powerstate !== 2) {
      return this.showPowerUpAlert().pipe(
        switchMap((result) => {
          // if they said yes, power on the device
          if (result) {
            return this.devicesService.sendPowerAction(this.deviceId(), 2)
          }
          return of(null)
        })
      )
    }
    return of(true)
  }

  getPowerState(guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading.set(false)
        const msg: string = err.error?.message || this.t('remotePlatformErase.errorRetrievingPower')
        this.displayError(msg)
        return EMPTY
      })
    )
  }

  showPowerUpAlert(): Observable<boolean> {
    const dialog = this.matDialog.open(PowerUpAlertComponent)
    return dialog.afterClosed()
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
    const ssdSelected = this.ssdIndex >= 0 && this.eraseCapsArray.at(this.ssdIndex)?.value === true
    this.isSsdSelected.set(ssdSelected)
    if (!ssdSelected) {
      this.resetSsdControls()
    }
    this.updateCapControlStates()
  }

  onSsdEncryptedChange(checked: boolean): void {
    this.isSsdEncrypted.set(checked)
    if (!checked) {
      this.ssdPasswordControl.setValue('')
    }
  }

  eraseCapControl(index: number): FormControl<boolean | null> {
    return this.eraseCapsArray.at(index) as FormControl<boolean | null>
  }

  toggleFeature(enabled: boolean): void {
    this.platformEraseEnabled.set(enabled)
    this.updateCapControlStates()
    const payload: AMTFeaturesRequest = {
      userConsent: this.amtFeatures()?.userConsent ?? '',
      enableKVM: this.amtFeatures()?.KVM ?? false,
      enableSOL: this.amtFeatures()?.SOL ?? false,
      enableIDER: this.amtFeatures()?.IDER ?? false,
      ocr: this.amtFeatures()?.ocr ?? false,
      rpe: enabled
    }
    this.isLoading.set(true)
    this.devicesService
      .setAmtFeatures(this.deviceId(), payload)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          this.platformEraseEnabled.set(!enabled)
          this.updateCapControlStates()
          const msg: string = err.error?.message || this.t('remotePlatformErase.toggleFeatureError')
          this.displayError(msg)
          return EMPTY
        })
      )
      .subscribe({
        next: () => {
          this.amtFeatures.update((f) => (f ? { ...f, rpe: enabled } : f))
          this.updateCapControlStates()
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

    this.checkUserConsent()
      .pipe(
        switchMap((result: any) =>
          // safely convert null to undefined for type compatibility
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures() ?? undefined)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId(), result, 'RPE')
        ),
        switchMap((result: any) => this.postUserConsentDecision(result, operations))
      )
      .subscribe()
  }

  postUserConsentDecision(result: any, operations: string): Observable<any> {
    if (result === false) {
      return of(null)
    }
    return this.matDialog
      .open(AreYouSureDialogComponent, {
        data: {
          message: 'remotePlatformErase.confirmMessage',
          params: { device: this.deviceLabel() || this.deviceId(), operations }
        }
      })
      .afterClosed()
      .pipe(
        switchMap((confirmed: boolean) => {
          if (confirmed === true) {
            this.executeErase()
          }
          return of(null)
        })
      )
  }

  private applyFeatures(features: AMTFeaturesResponse, capabilities: BootCapabilities): void {
    this.amtFeatures.update((f) => (f ? { ...f, ...features } : features))
    const supported = features.rpeSupported ?? false
    this.isPlatformEraseSupported.set(supported)
    this.platformEraseEnabled.set(features.rpe ?? false)
    const caps: ParsedPlatformEraseCapability[] = [
      { key: 'secureEraseSsds', supported: capabilities.secureEraseAllSSDs },
      { key: 'tpmClear', supported: capabilities.tpmClear },
      { key: 'biosRestore', supported: capabilities.restoreBIOSToEOM },
      { key: 'csmeUnconfigure', supported: capabilities.unconfigureCSME }
    ]
    this.eraseCaps.set(caps)
    this.csmeIndex = caps.findIndex((c) => c.key === CSME_UNCONFIGURE_KEY)
    this.ssdIndex = caps.findIndex((c) => c.key === SSD_ERASE_KEY)
    this.eraseCapsArray = this.fb.array(
      caps.map((cap) => this.fb.control<boolean | null>({ value: false, disabled: !cap.supported }))
    )
    this.selectedCapsCount.set(0)
    this.isCsmeExclusiveSelected.set(false)
    this.resetSsdControls()
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
    if (req.secureEraseAllSSDs && this.isSsdEncrypted()) {
      req.ssdPassword = this.ssdPasswordControl.value ?? ''
    }
    this.isLoading.set(true)
    this.devicesService
      .setRemoteEraseOptions(this.deviceId(), req)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => {
          const msg: string = err.error?.message || this.t('remotePlatformErase.eraseError')
          this.displayError(msg)
          return EMPTY
        })
      )
      .subscribe({
        next: () => {
          if (req.unconfigureCSME) {
            this.devicesService
              .sendDeactivate(this.deviceId())
              .pipe(catchError(() => EMPTY))
              .subscribe(() => {
                this.snackBar.open(
                  this.t('remotePlatformErase.csmeEraseSuccess'),
                  undefined,
                  SnackbarDefaults.defaultSuccess
                )
                void this.router.navigate(['/devices'])
              })
          } else {
            const successMsg = req.secureEraseAllSSDs
              ? this.t('remotePlatformErase.osEraseSuccess')
              : this.t('remotePlatformErase.eraseSuccess')
            this.snackBar.open(successMsg, undefined, SnackbarDefaults.defaultSuccess)
            this.amtFeatures.update((f) => (f ? { ...f, rpe: false } : f))
            this.platformEraseEnabled.set(false)
            this.eraseCapsArray.controls.forEach((c) => c.setValue(false, { emitEvent: false }))
            this.selectedCapsCount.set(0)
            this.isCsmeExclusiveSelected.set(false)
            this.resetSsdControls()
            this.updateCapControlStates()
          }
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
    if (!featureEnabled && this.isSsdSelected()) {
      this.resetSsdControls()
    }
  }

  checkUserConsent(): Observable<any> {
    if (
      this.amtFeatures()?.userConsent === 'none' ||
      this.amtFeatures()?.optInState === 3 ||
      this.amtFeatures()?.optInState === 4
    ) {
      this.readyToErase = true
      // Auto-connect when user consent is not required
      this.deviceConnection.set(true)
      return of(true)
    }
    return of(false)
  }

  private resetSsdControls(): void {
    this.isSsdSelected.set(false)
    this.isSsdEncrypted.set(false)
    this.ssdEncryptedControl.setValue(false)
    this.ssdPasswordControl.setValue('')
  }

  displayError(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }

  private t(key: string): string {
    return this.translate.instant(`${key}.value`) as string
  }
}
