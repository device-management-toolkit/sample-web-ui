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

@Component({
  selector: 'app-device-toolbar',
  templateUrl: './device-toolbar.component.html',
  styleUrls: ['./device-toolbar.component.scss']
})
export class DeviceToolbarComponent implements OnInit {
  @Input()
  public isLoading = false

  @Input()
  public deviceId: string = ''

  deviceState: number = 0
  public device: Device | null = null
  public powerOptions = [
    {
      label: 'Hibernate',
      action: 7
    }, {
      label: 'Sleep',
      action: 4
    }, {
      label: 'Reset',
      action: 10
    }, {
      label: 'Soft-Off',
      action: 12
    }, {
      label: 'Soft Reset',
      action: 14
    }, {
      label: 'Reset to IDE-R (CD-ROM)',
      action: 202
    }, {
      label: 'Reset to BIOS',
      action: 101
    }, {
      label: 'Power Up to BIOS',
      action: 100
    }, {
      label: 'Reset to PXE',
      action: 400
    }, {
      label: 'Power Up to PXE',
      action: 401
    }
  ]

  constructor (public snackBar: MatSnackBar,
    public readonly activatedRoute: ActivatedRoute,
    public readonly router: Router,
    private readonly devicesService: DevicesService,
    private readonly matDialog: MatDialog) { }

  ngOnInit (): void {
      this.devicesService.getDevice(this.deviceId).subscribe(data => {
        this.device = data
        this.devicesService.device.next(this.device)
      })
      this.devicesService.deviceState.subscribe(state => {
        this.deviceState = state
      })
  }

  editDevice (): void {
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

  sendPowerAction (action: number): void {
    this.isLoading = true
    let useSOL = false
    if (this.router.url.toString().includes('sol') && action === 101) {
      useSOL = true
    }
    this.devicesService.sendPowerAction(this.deviceId, action, useSOL).pipe(
      catchError(err => {
        // TODO: handle error better
        console.error(err)
        this.snackBar.open($localize`Error sending power action`, undefined, SnackbarDefaults.defaultError)
        return of(null)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      if (data.Body.ReturnValueStr === 'NOT_READY') {
        this.snackBar.open($localize`Power action sent but is not ready`, undefined, SnackbarDefaults.defaultWarn)
      } else {
        this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
      }
    })
  }

  stopSol (): void {
    this.devicesService.stopwebSocket.next(true)
  }

  stopKvm (): void {
    this.devicesService.stopwebSocket.next(true)
  }

  async navigateTo (path: string): Promise<void> {
    if (this.router.url === `/devices/${this.deviceId}/kvm` && path === 'kvm') {
      this.devicesService.connectKVMSocket.next(true)
    } else if (this.router.url === `/devices/${this.deviceId}/sol` && path === 'sol') {
      this.devicesService.startwebSocket.next(true)
    } else if (this.router.url === `/devices/${this.deviceId}` && path === 'devices') {
      await this.router.navigate(['/devices'])
    } else {
      await this.router.navigate([`/devices/${this.deviceId}/${path}`])
    }
  }

  sendDeactivate (): void {
    const dialogRef = this.matDialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.devicesService.sendDeactivate(this.deviceId).pipe(
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe({
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
