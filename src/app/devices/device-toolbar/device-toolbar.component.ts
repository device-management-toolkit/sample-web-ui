import { Component, Input, OnInit } from '@angular/core'
import { catchError, finalize } from 'rxjs/operators'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'

@Component({
  selector: 'app-device-toolbar',
  templateUrl: './device-toolbar.component.html',
  styleUrls: ['./device-toolbar.component.scss']
})
export class DeviceToolbarComponent implements OnInit {
  @Input() deviceState: number = 0
  @Input() public isLoading = false
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

  constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService) { }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.deviceId = params.id
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
        // TODO: handle error better
        console.log(err)
        this.snackBar.open($localize`Error sending power action`, undefined, SnackbarDefaults.defaultError)
        return of(null)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
      console.log(data)
    })
  }

  stopSol (): void {
    this.devicesService.stopwebSocket.next(true)
  }

  stopKvm (): void {
    this.devicesService.stopwebSocket.next(true)
  }

  async navigateTo (path: string): Promise<void> {
    this.devicesService.startwebSocket.next(true)
    await this.router.navigate([`/devices/${this.deviceId}/${path}`])
  }

  async navigateToKvm (path: string): Promise<void> {
    if (this.router.url === `/devices/${this.deviceId}/kvm`) {
      this.devicesService.connectKVMSocket.next(true)
    } else {
      await this.router.navigate([`/devices/${this.deviceId}/${path}`])
    }
  }
}
