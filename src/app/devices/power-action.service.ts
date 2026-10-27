/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Injectable, inject, signal } from '@angular/core'
import { catchError, finalize, map, switchMap } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { Observable, of, forkJoin, EMPTY, timer } from 'rxjs'
import { DevicesService } from './devices.service'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { AMTFeaturesResponse, BootDetails, UserConsentResponse } from '../../models/models'
import { MatDialog } from '@angular/material/dialog'
import { environment } from '../../environments/environment'
import { UserConsentService } from './user-consent.service'
import { HTTPBootDialogComponent } from './device-toolbar/http-boot-dialog/http-boot-dialog.component'
import { PBABootDialogComponent } from './device-toolbar/pba-boot-dialog/pba-boot-dialog.component'
import { TranslateService } from '@ngx-translate/core'

const PROVISIONING_MODE_CCM = 4

export interface PowerOptions {
  label: string
  action: number
}

// Extracted from DeviceToolbarComponent so KVM/SOL fullscreen controls can
// send power actions (via a floating menu) without leaving the device toolbar.
@Injectable({
  providedIn: 'root'
})
export class PowerActionService {
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly dialog = inject(MatDialog)
  private readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)
  private readonly router = inject(Router)

  public readonly isCloudMode: boolean = environment.cloud
  public readonly powerState = signal('Unknown')

  public readonly basePowerOptions: PowerOptions[] = [
    {
      label: 'powerOptions.hibernate.value',
      action: 7
    },
    {
      label: 'powerOptions.sleep.value',
      action: 4
    },
    {
      label: 'powerOptions.powerCycle.value',
      action: 5
    },
    {
      label: 'powerOptions.reset.value',
      action: 10
    },
    {
      label: 'powerOptions.softOff.value',
      action: 12
    },
    {
      label: 'powerOptions.softReset.value',
      action: 14
    },
    {
      label: 'powerOptions.resetToIDER.value',
      action: 202
    },
    {
      label: 'powerOptions.resetToBIOS.value',
      action: 101
    },
    {
      label: 'powerOptions.powerUpToBIOS.value',
      action: 100
    },
    {
      label: 'powerOptions.resetToPXE.value',
      action: 400
    },
    {
      label: 'powerOptions.powerUpToPXE.value',
      action: 401
    }
  ]

  // Conditional power options based on AMT features
  private readonly conditionalPowerOptions = {
    localPBABootSupported: [
      {
        label: 'powerOptions.resetToPBA.value',
        action: 107
      },
      {
        label: 'powerOptions.powerUpToPBA.value',
        action: 108
      }
    ],
    winREBootSupported: [
      {
        label: 'powerOptions.resetToWinRe.value',
        action: 109
      },
      {
        label: 'powerOptions.powerUpToWinRe.value',
        action: 110
      }
    ],
    httpsBootSupported: [
      {
        label: 'powerOptions.resetToHTTPSBoot.value',
        action: 105
      },
      {
        label: 'powerOptions.powerUpToHTTPSBoot.value',
        action: 106
      }
    ]
  }

  buildPowerOptions(amtFeatures: AMTFeaturesResponse | null): PowerOptions[] {
    let options: PowerOptions[] = [...this.basePowerOptions]

    if (amtFeatures?.ocr) {
      // Add HTTPS Boot options if httpsBootSupported is true
      if (amtFeatures.httpsBootSupported) {
        options = options.concat(this.conditionalPowerOptions.httpsBootSupported)
      }

      // Add PBA options if localPBABootSupported is true
      if (amtFeatures.localPBABootSupported) {
        options = options.concat(this.conditionalPowerOptions.localPBABootSupported)
      }

      if (amtFeatures.winREBootSupported) {
        options = options.concat(this.conditionalPowerOptions.winREBootSupported)
      }
    }

    // Sort options by action number for consistent ordering
    options.sort((a, b) => a.action - b.action)

    return options
  }

  setOptimisticPowerState(action: number): void {
    // Immediately reflect the expected outcome so the UI doesn't show the
    // old state while waiting for the device to transition.
    switch (action) {
      case 2: // power on
        this.powerState.set('deviceToolbar.power.on.value')
        break
      case 8: // power off
      case 12: // soft off
        this.powerState.set('deviceToolbar.power.off.value')
        break
      default: // reset, cycle, etc. — state is transitioning
        this.powerState.set('Unknown')
    }
  }

  setPowerStateLabel(powerstate: number): void {
    switch (powerstate) {
      case 2:
        this.powerState.set('deviceToolbar.power.on.value')
        break
      case 3:
      case 4:
        this.powerState.set('deviceToolbar.power.sleep.value')
        break
      default:
        this.powerState.set('deviceToolbar.power.off.value')
    }
  }

  sendPowerAction(deviceId: string, action: number, isLoading: { set: (value: boolean) => void }): void {
    if (action >= 100) {
      this.preprocessingForAuthorizedPowerAction(deviceId, action, isLoading)
    } else {
      this.executePowerAction(deviceId, action, isLoading)
    }
  }

  performHTTPBoot(deviceId: string, action: number, isLoading: { set: (value: boolean) => void }): void {
    this.devicesService
      .getAMTVersion(deviceId)
      .pipe(catchError(() => of(null)))
      .subscribe((amtVersion) => {
        const isCCM = amtVersion?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode === PROVISIONING_MODE_CCM
        const dialogRef = this.dialog.open(HTTPBootDialogComponent, {
          width: '400px',
          disableClose: false,
          data: { isCCM }
        })

        dialogRef.afterClosed().subscribe((bootDetails: BootDetails) => {
          if (!bootDetails) {
            return
          }
          this.executeAuthorizedPowerAction(deviceId, action, isLoading, false, bootDetails)
        })
      })
  }

  performPBABoot(deviceId: string, action: number, isLoading: { set: (value: boolean) => void }): void {
    forkJoin({
      amtVersion: this.devicesService.getAMTVersion(deviceId).pipe(catchError(() => of(null))),
      sources: this.devicesService.getBootSources(deviceId)
    }).subscribe(({ amtVersion, sources }) => {
      const isCCM = amtVersion?.AMT_SetupAndConfigurationService?.response?.ProvisioningMode === PROVISIONING_MODE_CCM
      const pbaSources = sources.filter((s) => s.biosBootString?.toLowerCase().includes('pba'))
      const dialogRef = this.dialog.open(PBABootDialogComponent, {
        width: '400px',
        disableClose: false,
        data: {
          pbaBootFilesPath: pbaSources,
          action,
          isCCM
        }
      })
      dialogRef.afterClosed().subscribe((bootDetails: BootDetails) => {
        if (!bootDetails) {
          return
        }
        this.executeAuthorizedPowerAction(deviceId, action, isLoading, false, bootDetails)
      })
    })
  }

  performWinREBoot(deviceId: string, action: number, isLoading: { set: (value: boolean) => void }): void {
    const bootDetails: BootDetails = {
      enforceSecureBoot: true
    }
    this.executeAuthorizedPowerAction(deviceId, action, isLoading, false, bootDetails)
  }

  preprocessingForAuthorizedPowerAction(deviceId: string, action: number, isLoading: { set: (value: boolean) => void }): void {
    // Handle specific action pre-processing
    switch (action) {
      case 105:
      case 106: // HTTP Boot action
        this.performHTTPBoot(deviceId, action, isLoading)
        break
      case 107:
      case 108: // PBA Boot action
        this.performPBABoot(deviceId, action, isLoading)
        break
      case 109:
      case 110: // WinRE Boot action
        this.performWinREBoot(deviceId, action, isLoading)
        break
      case 101: {
        // Reset to BIOS
        const useSOL = this.router.url.toString().includes('sol')
        this.executeAuthorizedPowerAction(deviceId, action, isLoading, useSOL)
        break
      }
      default:
        this.executeAuthorizedPowerAction(deviceId, action, isLoading)
        break
    }
  }

  executeAuthorizedPowerAction(
    deviceId: string,
    action: number | undefined,
    isLoading: { set: (value: boolean) => void },
    useSOL = false,
    bootDetails: BootDetails = {} as BootDetails
  ): void {
    isLoading.set(true)
    this.devicesService
      .getAMTFeatures(deviceId)
      .pipe(
        switchMap((results: AMTFeaturesResponse) =>
          this.handleAMTFeaturesResponse(results).pipe(map((consentSatisfied) => ({ results, consentSatisfied })))
        ),
        switchMap(({ results, consentSatisfied }) => {
          if (consentSatisfied) {
            return of({ result: null, results })
          }
          return this.checkUserConsent(results).pipe(map((result) => ({ result, results })))
        }),
        switchMap(({ result, results }) => this.userConsentService.handleUserConsentDecision(result, deviceId, results ?? undefined)),
        switchMap((result: any | UserConsentResponse) => this.userConsentService.handleUserConsentResponse(deviceId, result, 'PowerAction'))
      )
      .subscribe({
        next: () => {
          if (action !== undefined) {
            this.executePowerAction(deviceId, action, isLoading, useSOL, bootDetails)
          }
        },
        error: () => {
          const msg: string = this.translate.instant('devices.errorInitializing.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        },
        complete: () => {
          isLoading.set(false)
        }
      })
  }

  executePowerAction(
    deviceId: string,
    action: number,
    isLoading: { set: (value: boolean) => void },
    useSOL = false,
    bootDetails: BootDetails = {} as BootDetails
  ): void {
    isLoading.set(true)
    this.devicesService
      .sendPowerAction(deviceId, action, useSOL, bootDetails)
      .pipe(
        catchError((err) => {
          console.error(err)
          const msg: string = this.translate.instant('devices.errorPowerAction.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return of(null)
        }),
        finalize(() => {
          isLoading.set(false)
        })
      )
      .subscribe((data) => {
        if (this.isCloudMode) {
          if (data.Body?.ReturnValueStr === 'NOT_READY') {
            const msg: string = this.translate.instant('devices.powerActionNotReady.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultWarn)
          } else {
            const msg: string = this.translate.instant('devices.powerActionSent.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
          }
        } else {
          if (data.ReturnValue === 0) {
            const msg: string = this.translate.instant('devices.powerActionSent.value')
            console.log('Power action sent successfully:', data)
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
            // Set expected state immediately for instant feedback.
            this.setOptimisticPowerState(action)
            // Then silently confirm actual state after device transitions — no loading spinner.
            timer(5000).subscribe(() => {
              this.silentRefreshPowerState(deviceId, isLoading)
            })
          } else {
            console.log('Power action failed:', data)
            const msg: string = this.translate.instant('devices.failPowerAction.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          }
        }
      })
  }

  loadPowerState(deviceId: string, isLoading: { set: (value: boolean) => void }): void {
    // Use cached to dedupe simultaneous requests (KVM deep-link + toolbar both loading).
    this.fetchPowerState(this.devicesService.getPowerStateCached(deviceId), isLoading)
  }

  refreshPowerState(deviceId: string, isLoading: { set: (value: boolean) => void }): void {
    // Bypass the cache so manual refresh always fetches the latest state from the device.
    this.fetchPowerState(this.devicesService.getPowerState(deviceId), isLoading, false, () => {
      const msg: string = this.translate.instant('kvm.errorRetrievePower.value')
      this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
    })
  }

  silentRefreshPowerState(deviceId: string, isLoading: { set: (value: boolean) => void }): void {
    // Refresh without showing the loading spinner — used after a power action
    // where the optimistic state is already shown to the user.
    this.fetchPowerState(this.devicesService.getPowerState(deviceId), isLoading, true)
  }

  fetchPowerState(
    source: Observable<any>,
    isLoading: { set: (value: boolean) => void },
    silent = false,
    onError?: () => void
  ): void {
    if (!silent) {
      isLoading.set(true)
    }

    source
      .pipe(
        catchError((err) => {
          if (onError) {
            console.error(err)
            onError()
          }
          return EMPTY
        }),
        finalize(() => {
          if (!silent) {
            isLoading.set(false)
          }
        })
      )
      .subscribe((powerState) => {
        this.setPowerStateLabel(powerState.powerstate)
      })
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    if (results?.userConsent === 'None') {
      return of(true) // User consent is not required
    }
    return of(false)
  }

  checkUserConsent(amtFeatures: AMTFeaturesResponse | null): Observable<any> {
    if (amtFeatures?.userConsent === 'none' || amtFeatures?.optInState === 3 || amtFeatures?.optInState === 4) {
      return of(true)
    }
    return of(false)
  }
}
