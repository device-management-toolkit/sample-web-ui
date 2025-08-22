/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input } from '@angular/core'
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
    MatProgressBar
  ]
})
export class DeviceToolbarComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly matDialog = inject(MatDialog)
  private readonly dialog = inject(MatDialog)
  public readonly router = inject(Router)

  public readonly isLoading = input(signal(false))

  public readonly deviceId = input('')
  public readonly isPinned = signal(false)

  public amtFeatures?: AMTFeaturesResponse
  public isCloudMode = environment.cloud
  public device: Device | null = null
  public powerState = signal('Unknown')
  public powerOptions = [
    {
      label: 'Hibernate',
      action: 7
    },
    {
      label: 'Sleep',
      action: 4
    },
    {
      label: 'Power Cycle',
      action: 5
    },
    {
      label: 'Reset',
      action: 10
    },
    {
      label: 'Soft-Off',
      action: 12
    },
    {
      label: 'Soft Reset',
      action: 14
    },
    {
      label: 'Reset to IDE-R (CD-ROM)',
      action: 202
    },
    {
      label: 'Reset to BIOS',
      action: 101
    },
    {
      label: 'Power Up to BIOS',
      action: 100
    },
    {
      label: 'Reset to PXE',
      action: 400
    },
    {
      label: 'Power Up to PXE',
      action: 401
    },
    {
      label: 'Reset to HTTPS Boot (OCR)',
      action: 105
    },
    {
      label: 'Power Up to HTTPS Boot (OCR)',
      action: 106
    }
  ]

  ngOnInit(): void {
    this.devicesService.getDevice(this.deviceId()).subscribe((data) => {
      this.device = data
      this.devicesService.device.next(this.device)
      this.isPinned.set(this.device?.certHash != null && this.device?.certHash !== '')
      this.getPowerState()
    })
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

  preprocessingForAuthorizedPowerAction(action?: number): void {
    // Handle specific action pre-processing
    switch (action) {
      case 105:
      case 106: // HTTP Boot action
        this.performHTTPBoot(action)
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
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures)
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
          this.snackBar.open($localize`Error initializing`, undefined, SnackbarDefaults.defaultError)
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
          this.snackBar.open($localize`Error sending power action`, undefined, SnackbarDefaults.defaultError)
          return of(null)
        }),
        finalize(() => {
          this.isLoading().set(false)
        })
      )
      .subscribe((data) => {
        if (this.isCloudMode) {
          if (data.Body?.ReturnValueStr === 'NOT_READY') {
            this.snackBar.open($localize`Power action sent but is not ready`, undefined, SnackbarDefaults.defaultWarn)
          } else {
            this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
          }
        } else {
          if (data.ReturnValue === 0) {
            console.log('Power action sent successfully:', data)
            this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
          } else {
            console.log('Power action failed:', data)
            this.snackBar.open($localize`Power action failed`, undefined, SnackbarDefaults.defaultError)
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
              this.snackBar.open($localize`Deactivation sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
              void this.navigateTo('devices')
            },
            error: (err) => {
              console.error(err)
              this.snackBar.open($localize`Error sending deactivation`, undefined, SnackbarDefaults.defaultError)
            }
          })
      }
    })
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    this.amtFeatures = results
    if (this.amtFeatures.userConsent === 'None') {
      return of(true) // User consent is not required
    }
    return of(false)
  }

  checkUserConsent(): Observable<any> {
    if (
      this.amtFeatures?.userConsent === 'none' ||
      this.amtFeatures?.optInState === 3 ||
      this.amtFeatures?.optInState === 4
    ) {
      return of(true)
    }
    return of(false)
  }
}
