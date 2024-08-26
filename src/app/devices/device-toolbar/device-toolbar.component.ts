/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, OnInit } from '@angular/core'
import { catchError, finalize } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { Device } from 'src/models/models'
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

@Component({
  selector: 'app-device-toolbar',
  templateUrl: './device-toolbar.component.html',
  styleUrls: ['./device-toolbar.component.scss'],
  standalone: true,
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
  @Input()
  public isLoading = false

  @Input()
  public deviceId = ''

  public isCloudMode = environment.cloud
  public device: Device | null = null
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

  constructor(
    public snackBar: MatSnackBar,
    public readonly activatedRoute: ActivatedRoute,
    public readonly router: Router,
    private readonly devicesService: DevicesService,
    private readonly matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.devicesService.getDevice(this.deviceId).subscribe((data) => {
      this.device = data
      this.devicesService.device.next(this.device)
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
}
