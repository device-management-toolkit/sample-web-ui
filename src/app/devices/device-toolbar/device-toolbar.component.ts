/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input, DestroyRef } from '@angular/core'
import { catchError, finalize, switchMap } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AMTFeaturesResponse, BootDetails, Device, UserConsentResponse } from 'src/models/models'
import { MatDialog } from '@angular/material/dialog'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'
import { environment } from 'src/environments/environment'
import { AddDeviceEnterpriseComponent } from 'src/app/shared/add-device-enterprise/add-device-enterprise.component'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton } from '@angular/material/button'
import { MatChipSet, MatChip } from '@angular/material/chips'
import { MatToolbar } from '@angular/material/toolbar'
import { DeviceCertDialogComponent } from '../device-cert-dialog/device-cert-dialog.component'
import { UserConsentService } from '../user-consent.service'
import { HTTPBootDialogComponent } from './http-boot-dialog/http-boot-dialog.component'
import { PBABootDialogComponent } from './pba-boot-dialog/pba-boot-dialog.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

interface PowerOptions {
  label: string
  action: number
}
@Component({
  selector: 'app-device-toolbar',
  templateUrl: './device-toolbar.component.html',
  styleUrls: ['./device-toolbar.component.scss'],
  imports: [
    MatToolbar,
    MatChipSet,
    MatChip,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatDivider,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatProgressBar,
    TranslateModule
  ]
})
export class DeviceToolbarComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly matDialog = inject(MatDialog)
  private readonly dialog = inject(MatDialog)
  private readonly destroyRef = inject(DestroyRef)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)

  public readonly isLoading = input(signal(false))

  public readonly deviceId = input('')
  public readonly isPinned = signal(false)

  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public isCloudMode = environment.cloud
  public device: Device | null = null
  public powerState = signal('Unknown')
  public basePowerOptions: PowerOptions[] = [
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
  public powerOptions = signal<PowerOptions[]>([])

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

  ngOnInit(): void {
    this.devicesService.getDevice(this.deviceId()).subscribe((data) => {
      this.device = data
      this.devicesService.device.next(this.device)
      this.isPinned.set(this.device?.certHash != null && this.device?.certHash !== '')
      this.getPowerState()
      this.loadAMTFeatures()
      // react to AMT feature updates emitted by service
      this.devicesService
        .featuresChanges(this.deviceId())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((features) => {
          if (features) {
            this.amtFeatures.set(features)
            this.buildPowerOptions()
          }
        })
    })
  }

  private loadAMTFeatures(): void {
    this.devicesService.getAMTFeatures(this.deviceId()).subscribe((features) => {
      this.amtFeatures.set(features)
      this.buildPowerOptions()
    })
  }

  private buildPowerOptions(): void {
    let options: PowerOptions[] = [...this.basePowerOptions]

    const f = this.amtFeatures()
    if (f?.ocr) {
      // Add HTTPS Boot options if httpsBootSupported is true
      if (f.httpsBootSupported) {
        options = options.concat(this.conditionalPowerOptions.httpsBootSupported)
      }

      // Add PBA options if localPBABootSupported is true
      if (f.localPBABootSupported) {
        options = options.concat(this.conditionalPowerOptions.localPBABootSupported)
      }

      if (f.winREBootSupported) {
        options = options.concat(this.conditionalPowerOptions.winREBootSupported)
      }
    }

    // Sort options by action number for consistent ordering
    options.sort((a, b) => a.action - b.action)

    this.powerOptions.set(options)
  }

  getPowerState(): void {
    this.isLoading().set(true)
    this.devicesService.getPowerState(this.deviceId()).subscribe((powerState) => {
      this.powerState.set(
        powerState.powerstate.toString() === '2'
          ? 'Power: On'
          : powerState.powerstate.toString() === '3' || powerState.powerstate.toString() === '4'
            ? 'Power: Sleep'
            : 'Power: Off'
      )
      this.isLoading().set(false)
    })
  }

  getDeviceCert(): void {
    this.devicesService.getDeviceCertificate(this.deviceId()).subscribe((data) => {
      this.matDialog
        .open(DeviceCertDialogComponent, { data: { certData: data, isPinned: this.isPinned() } })
        .afterClosed()
        .subscribe((pinned) => {
          if (pinned != null) {
            this.device!.certHash = pinned ? 'yup' : ''
            this.isPinned.set(!!pinned)
          }
        })
    })
  }

  editDevice(): void {
    if (!environment.cloud) {
      const sub = this.matDialog.open(AddDeviceEnterpriseComponent, {
        height: '500px',
        width: '600px',
        data: this.device
      })
      sub.afterClosed().subscribe(() => {
        window.location.reload()
        this.snackBar.open('Device updated successfully', undefined, SnackbarDefaults.defaultSuccess)
      })
    }
  }

  sendPowerAction(action: number): void {
    if (action >= 100) {
      this.preprocessingForAuthorizedPowerAction(action)
    } else {
      this.executePowerAction(action)
    }
  }

  performHTTPBoot(action: number): void {
    const dialogRef = this.dialog.open(HTTPBootDialogComponent, {
      width: '400px',
      disableClose: false
    })

    dialogRef.afterClosed().subscribe((bootDetails: BootDetails) => {
      if (!bootDetails) {
        return
      }
      this.executeAuthorizedPowerAction(action, false, bootDetails)
    })
  }

  // Add this new method for PBA boot
  performPBABoot(action: number): void {
    this.devicesService.getBootSources(this.deviceId()).subscribe((sources) => {
      const pbaSources = sources.filter((s) => s.biosBootString?.toLowerCase().includes('pba'))
      const dialogRef = this.dialog.open(PBABootDialogComponent, {
        width: '400px',
        disableClose: false,
        data: {
          pbaBootFilesPath: pbaSources,
          action: action
        }
      })
      dialogRef.afterClosed().subscribe((bootDetails: BootDetails) => {
        if (!bootDetails) {
          return
        }
        this.executeAuthorizedPowerAction(action, false, bootDetails)
      })
    })
  }

  performWinREBoot(action: number): void {
    const bootDetails: BootDetails = {
      enforceSecureBoot: true
    }
    this.executeAuthorizedPowerAction(action, false, bootDetails)
  }

  preprocessingForAuthorizedPowerAction(action?: number): void {
    // Handle specific action pre-processing
    switch (action) {
      case 105:
      case 106: // HTTP Boot action
        this.performHTTPBoot(action)
        break
      case 107:
      case 108: // PBA Boot action
        this.performPBABoot(action)
        break
      case 109:
      case 110: // WinRE Boot action
        this.performWinREBoot(action)
        break
      case 101: {
        // Reset to BIOS
        const useSOL = this.router.url.toString().includes('sol')
        this.executeAuthorizedPowerAction(action, useSOL)
        break
      }
      default:
        this.executeAuthorizedPowerAction(action)
        break
    }
  }

  executeAuthorizedPowerAction(action?: number, useSOL = false, bootDetails: BootDetails = {} as BootDetails): void {
    this.isLoading().set(true)
    this.devicesService
      .getAMTFeatures(this.deviceId())
      .pipe(
        switchMap((results: AMTFeaturesResponse) => this.handleAMTFeaturesResponse(results)),
        switchMap((result: boolean) => {
          if (result) {
            return of(null)
          } else {
            return this.checkUserConsent()
          }
        }),
        switchMap((result: any) =>
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures() ?? undefined)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId(), result, 'PowerAction')
        )
      )
      .subscribe({
        next: () => {
          if (action !== undefined) {
            this.executePowerAction(action, useSOL, bootDetails)
          }
        },
        error: () => {
          const msg: string = this.translate.instant('devices.errorInitializing.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        },
        complete: () => {
          this.isLoading().set(false)
        }
      })
  }

  executePowerAction(action: number, useSOL = false, bootDetails: BootDetails = {} as BootDetails): void {
    this.isLoading().set(true)
    this.devicesService
      .sendPowerAction(this.deviceId(), action, useSOL, bootDetails)
      .pipe(
        catchError((err) => {
          console.error(err)
          const msg: string = this.translate.instant('devices.errorPowerAction.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return of(null)
        }),
        finalize(() => {
          this.isLoading().set(false)
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
          } else {
            console.log('Power action failed:', data)
            const msg: string = this.translate.instant('devices.failPowerAction.value')
            this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          }
        }
      })
  }

  async navigateTo(path: string): Promise<void> {
    const deviceId = this.deviceId()
    if (this.router.url === `/devices/${deviceId}` && path === 'devices') {
      await this.router.navigate(['/devices'])
    } else {
      await this.router.navigate([`/devices/${deviceId}/${path}`])
    }
  }

  sendDeactivate(): void {
    const dialogRef = this.matDialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading().set(true)
        this.devicesService
          .sendDeactivate(this.deviceId())
          .pipe(
            finalize(() => {
              this.isLoading().set(false)
            })
          )
          .subscribe({
            next: () => {
              const msg: string = this.translate.instant('devices.deactivation.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
              void this.navigateTo('devices')
            },
            error: (err) => {
              console.error(err)
              const msg: string = this.translate.instant('devices.errorDeactivation.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
            }
          })
      }
    })
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    this.amtFeatures.set(results)
    if (this.amtFeatures()?.userConsent === 'None') {
      return of(true) // User consent is not required
    }
    return of(false)
  }

  checkUserConsent(): Observable<any> {
    if (
      this.amtFeatures()?.userConsent === 'none' ||
      this.amtFeatures()?.optInState === 3 ||
      this.amtFeatures()?.optInState === 4
    ) {
      return of(true)
    }
    return of(false)
  }

  public get deactivateRemoveAction(): string {
    return this.isCloudMode
      ? this.translate.instant('devices.actions.deactivateCloud.value')
      : this.translate.instant('devices.actions.remove.value')
  }
}
