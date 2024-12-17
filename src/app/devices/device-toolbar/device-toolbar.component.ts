/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, OnInit, inject } from '@angular/core'
import { catchError, finalize, switchMap } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AMTFeaturesResponse, Device, UserConsentResponse } from 'src/models/models'
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
  snackBar = inject(MatSnackBar)
  readonly router = inject(Router)
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly matDialog = inject(MatDialog)

  @Input()
  public isLoading = false

  @Input()
  public deviceId = ''

  amtFeatures?: AMTFeaturesResponse
  public isCloudMode = environment.cloud
  public device: Device | null = null
  public powerState = ''
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
    }
  ]

  ngOnInit(): void {
    this.devicesService.getDevice(this.deviceId).subscribe((data) => {
      this.device = data
      this.devicesService.device.next(this.device)
      this.getPowerState()
    })
  }
  getPowerState(): void {
    this.isLoading = true
    this.devicesService.getPowerState(this.deviceId).subscribe((powerState) => {
      this.powerState =
        powerState.powerstate.toString() === '2'
          ? 'Power: On'
          : powerState.powerstate.toString() === '3' || powerState.powerstate.toString() === '4'
            ? 'Power: Sleep'
            : 'Power: Off'
      this.isLoading = false
    })
  }
  isPinned(): boolean {
    return this.device?.certHash != null && this.device?.certHash !== ''
  }
  getDeviceCert(): void {
    this.devicesService.getDeviceCertificate(this.deviceId).subscribe((data) => {
      this.matDialog
        .open(DeviceCertDialogComponent, { data: { certData: data, isPinned: this.isPinned() } })
        .afterClosed()
        .subscribe((isPinned) => {
          if (isPinned != null && isPinned !== '') {
            this.device!.certHash = isPinned ? 'yup' : ''
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
      this.executeAuthorizedPowerAction(action)
    } else {
      this.executePowerAction(action)
    }
  }

  executeAuthorizedPowerAction(action?: number): void {
    this.isLoading = true
    this.devicesService
      .getAMTFeatures(this.deviceId)
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
          this.userConsentService.handleUserConsentDecision(result, this.deviceId, this.amtFeatures)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId, result, 'PowerAction')
        )
      )
      .subscribe({
        next: () => {
          if (action !== undefined) {
            this.executePowerAction(action)
          }
        },
        error: (error) => {
          this.snackBar.open($localize`Error initializing`, undefined, SnackbarDefaults.defaultError)
        },
        complete: () => {
          this.isLoading = false
        }
      })
  }

  executePowerAction(action: number): void {
    this.isLoading = true
    let useSOL = false
    if (this.router.url.toString().includes('sol') && action === 101) {
      useSOL = true
    }
    this.devicesService
      .sendPowerAction(this.deviceId, action, useSOL)
      .pipe(
        catchError((err) => {
          console.error(err)
          this.snackBar.open($localize`Error sending power action`, undefined, SnackbarDefaults.defaultError)
          return of(null)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe((data) => {
        if (data.Body.ReturnValueStr === 'NOT_READY') {
          this.snackBar.open($localize`Power action sent but is not ready`, undefined, SnackbarDefaults.defaultWarn)
        } else {
          this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
        }
      })
  }

  async navigateTo(path: string): Promise<void> {
    if (this.router.url === `/devices/${this.deviceId}` && path === 'devices') {
      await this.router.navigate(['/devices'])
    } else {
      await this.router.navigate([`/devices/${this.deviceId}/${path}`])
    }
  }

  sendDeactivate(): void {
    const dialogRef = this.matDialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading = true
        this.devicesService
          .sendDeactivate(this.deviceId)
          .pipe(
            finalize(() => {
              this.isLoading = false
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
