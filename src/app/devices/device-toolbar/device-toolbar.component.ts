/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input, DestroyRef } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { AMTFeaturesResponse, Device } from '../../../models/models'
import { MatDialog } from '@angular/material/dialog'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'
import { environment } from '../../../environments/environment'
import { AddDeviceEnterpriseComponent } from '../../shared/add-device-enterprise/add-device-enterprise.component'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton } from '@angular/material/button'
import { MatChipSet, MatChip } from '@angular/material/chips'
import { MatToolbar } from '@angular/material/toolbar'
import { DeviceCertDialogComponent } from '../device-cert-dialog/device-cert-dialog.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs/operators'
import { PowerActionService, PowerOptions } from '../power-action.service'

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
    TranslatePipe
  ]
})
export class DeviceToolbarComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly matDialog = inject(MatDialog)
  private readonly destroyRef = inject(DestroyRef)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly powerActionService = inject(PowerActionService)

  public readonly isLoading = input(signal(false))

  public readonly deviceId = input('')
  public readonly isPinned = signal(false)

  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public isCloudMode = environment.cloud
  public device = signal<Device | null>(null)
  public powerState = this.powerActionService.powerState
  public powerOptions = signal<PowerOptions[]>([])

  ngOnInit(): void {
    this.devicesService
      .getDevice(this.deviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.device.set(data)
        this.devicesService.device.next(data)
        this.isPinned.set(data.certHash != null && data.certHash !== '')
        this.powerActionService.loadPowerState(this.deviceId(), this.isLoading())
        this.loadAMTFeatures()
        // react to AMT feature updates emitted by service
        this.devicesService
          .featuresChanges(this.deviceId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((features) => {
            if (features) {
              this.amtFeatures.set(features)
              this.powerOptions.set(this.powerActionService.buildPowerOptions(features))
            }
          })
      })
  }

  private loadAMTFeatures(): void {
    // Use cached features if fresher than 30s — avoids a duplicate AMT round-trip
    // when the KVM/SOL component already loaded features moments before the toolbar.
    this.devicesService
      .getAMTFeaturesCached(this.deviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((features) => {
        this.amtFeatures.set(features)
        this.powerOptions.set(this.powerActionService.buildPowerOptions(features))
      })
  }

  refreshPowerState(): void {
    this.powerActionService.refreshPowerState(this.deviceId(), this.isLoading())
  }

  getDeviceCert(): void {
    this.devicesService
      .getDeviceCertificate(this.deviceId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.matDialog
          .open(DeviceCertDialogComponent, { data: { certData: data, isPinned: this.isPinned() } })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((pinned) => {
            if (pinned != null) {
              this.device.update((device) => (device ? { ...device, certHash: pinned ? 'yup' : '' } : device))
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
        data: this.device()
      })
      sub
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          window.location.reload()
          this.snackBar.open('Device updated successfully', undefined, SnackbarDefaults.defaultSuccess)
        })
    }
  }

  sendPowerAction(action: number): void {
    this.powerActionService.sendPowerAction(this.deviceId(), action, this.isLoading())
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
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.isLoading().set(true)
          this.devicesService
            .sendDeactivate(this.deviceId())
            .pipe(
              takeUntilDestroyed(this.destroyRef),
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

  public get deactivateRemoveAction(): string {
    return this.isCloudMode
      ? this.translate.instant('devices.actions.deactivateCloud.value')
      : this.translate.instant('devices.actions.remove.value')
  }
}
