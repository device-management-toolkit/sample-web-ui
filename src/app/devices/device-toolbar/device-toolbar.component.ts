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
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton } from '@angular/material/button'
import { MatChipSet, MatChip } from '@angular/material/chips'
import { MatToolbar } from '@angular/material/toolbar'

@Component({
    selector: 'app-device-toolbar',
    templateUrl: './device-toolbar.component.html',
    styleUrls: ['./device-toolbar.component.scss'],
    standalone: true,
    imports: [MatToolbar, MatChipSet, MatChip, MatIconButton, MatTooltip, MatIcon, MatDivider, MatMenuTrigger, MatMenu, MatMenuItem, MatProgressBar]
})
export class DeviceToolbarComponent implements OnInit {
  @Input() deviceState: number = 0
  @Input() public isLoading = false
  public device: Device | null = null
  public deviceId: string = ''
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

  constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService, private readonly matDialog: MatDialog) { }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.deviceId = params.id
      this.devicesService.getDevice(this.deviceId).subscribe(data => {
        this.device = data
        this.devicesService.device.next(this.device)
      })
    })
  }

  sendPowerAction (action: number): void {
    this.isLoading = true
    let useSOL = false
    if (this.router.url.toString().includes('sol') && action === 101) {
      useSOL = true
    }
    this.devicesService.sendPowerAction(this.deviceId, action, useSOL).pipe(
      catchError(err => {
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
