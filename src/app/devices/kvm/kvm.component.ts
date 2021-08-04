/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { interval, of, Subscription } from 'rxjs'
import { catchError, finalize, mergeMap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { environment } from 'src/environments/environment'
import { AuthService } from 'src/app/auth.service'

@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss']
})
export class KvmComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading: boolean = false
  deviceId: string = ''
  powerState: any = 0
  isPoweredOn: boolean = false
  mpsServer: string = `${environment.mpsServer.replace('http', 'ws')}/relay`
  readytoLoadKvm: boolean = false
  authToken: string = ''
  timeInterval!: any
  selected: number = 1
  @Input() deviceState: number = 0
  @Output() deviceConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)
  @Output() selectedEncoding: EventEmitter<number> = new EventEmitter<number>()
  stopSocketSubscription!: Subscription
  startSocketSubscription!: Subscription

  encodings = [
    { value: 1, viewValue: 'RLE 8' },
    { value: 2, viewValue: 'RLE 16' }
  ]

  constructor (public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private readonly devicesService: DevicesService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly authService: AuthService,
    public readonly router: Router) {
    this.authToken = this.authService.getLoggedUserToken()
    if (environment.mpsServer.includes('/mps')) { // handles kong route
      this.mpsServer = `${environment.mpsServer.replace('http', 'ws')}/ws/relay`
    }
  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
    })
    this.startSocketSubscription = this.devicesService.connectKVMSocket.subscribe(() => {
      this.setAmtFeatures()
      this.deviceConnection.emit(true)
    })
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe(() => {
      this.deviceConnection.emit(false)
    })
    this.timeInterval = interval(15000).pipe(mergeMap(() => this.devicesService.getPowerState(this.deviceId))).subscribe()
  }

  ngAfterViewInit (): void {
    this.setAmtFeatures()
  }

  init (): void {
    this.devicesService.getPowerState(this.deviceId).pipe(
      catchError(() => {
        this.snackBar.open($localize`Error retrieving power status`, undefined, SnackbarDefaults.defaultError)
        return of()
      }), finalize(() => {
      })
    ).subscribe(data => {
      this.powerState = data
      this.isPoweredOn = this.checkPowerStatus()
      if (!this.isPoweredOn) {
        this.isLoading = false
        const dialog = this.dialog.open(PowerUpAlertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.isLoading = true
            this.devicesService.sendPowerAction(this.deviceId, 2).pipe().subscribe(data => {
              setTimeout(() => {
                this.readytoLoadKvm = true
              }, 4000)
            })
          }
        })
      } else {
        setTimeout(() => {
          this.readytoLoadKvm = true
        }, 0)
      }
    })
  }

  checkPowerStatus (): boolean {
    return this.powerState.powerstate === 2
  }

  setAmtFeatures (): void {
    this.isLoading = true
    this.devicesService.setAmtFeatures(this.deviceId).pipe(catchError(() => {
      this.snackBar.open($localize`Unable to change user consent - code required for KVM in CCM`, undefined, SnackbarDefaults.defaultWarn)
      this.init()
      return of()
    }), finalize(() => {
    })).subscribe(() => this.init())
  }

  onEncodingChange = (e: any): void => {
    this.selectedEncoding.emit(e)
  }

  deviceStatus = (event: any): void => {
    if (event === 2) {
      this.deviceState = event
      this.isLoading = false
    } else {
      this.deviceState = event
    }
  }

  ngOnDestroy (): void {
    if (this.timeInterval) {
      this.timeInterval.unsubscribe()
    }
    if (this.startSocketSubscription) {
      this.startSocketSubscription.unsubscribe()
    }
    if (this.stopSocketSubscription) {
      this.stopSocketSubscription.unsubscribe()
    }
  }
}
