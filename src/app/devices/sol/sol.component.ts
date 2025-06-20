/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  Component,
  OnInit,
  ViewEncapsulation,
  Output,
  EventEmitter,
  OnDestroy,
  HostListener,
  inject,
  signal,
  input
} from '@angular/core'
import { ActivatedRoute, NavigationStart, Router } from '@angular/router'
import { defer, iif, Observable, of, Subscription, throwError } from 'rxjs'
import { catchError, switchMap, tap } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { environment } from 'src/environments/environment'
import { AMTFeaturesRequest, AMTFeaturesResponse, PowerState, UserConsentResponse } from 'src/models/models'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { DeviceEnableSolComponent } from '../device-enable-sol/device-enable-sol.component'
import { SOLComponent } from '@device-management-toolkit/ui-toolkit-angular'
import { MatToolbar } from '@angular/material/toolbar'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { UserConsentService } from '../user-consent.service'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatToolbar,
    MatIcon,
    MatButton,
    SOLComponent
  ]
})
export class SolComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private readonly activatedRoute = inject(ActivatedRoute)
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly dialog = inject(MatDialog)
  private readonly router = inject(Router)
  public readonly snackBar = inject(MatSnackBar)

  public readonly deviceId = input('')

  public readonly deviceState = signal(0)

  @Output()
  public deviceConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)

  public results: any
  public amtFeatures?: AMTFeaturesResponse
  public isLoading = signal(false)
  public powerState: PowerState = { powerstate: 0 }
  public readyToLoadSol = false
  public mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  public authToken = signal(environment.cloud ? '' : 'direct')
  public isDisconnecting = false

  private stopSocketSubscription!: Subscription
  private startSocketSubscription!: Subscription

  constructor() {
    if (environment.mpsServer.includes('/mps')) {
      // handles kong route
      this.mpsServer = `${environment.mpsServer.replace('http', 'ws')}/ws/relay`
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isDisconnecting = true
      }
    })
  }

  ngOnDestroy(): void {
    this.isDisconnecting = true
    if (this.startSocketSubscription) {
      this.startSocketSubscription.unsubscribe()
    }
    if (this.stopSocketSubscription) {
      this.stopSocketSubscription.unsubscribe()
    }
  }

  ngOnInit(): void {
    this.devicesService
      .getRedirectionExpirationToken(this.deviceId())
      .pipe(
        tap((result) => {
          this.authToken.set(result.token)
        })
      )
      .subscribe()

    // used for receiving messages from the sol connect button on the toolbar
    this.startSocketSubscription = this.devicesService.startwebSocket.subscribe(() => {
      this.init()
      this.deviceConnection.emit(true)
    })

    // used for receiving messages from the sol disconnect button on the toolbar
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe(() => {
      this.isDisconnecting = true
      this.deviceConnection.emit(false)
    })

    this.init()
  }

  init(): void {
    this.isLoading.set(true)
    // device needs to be powered on in order to start SOL session
    this.getPowerState(this.deviceId())
      .pipe(
        switchMap((powerState) => this.handlePowerState(powerState)),
        switchMap((result) => (result === null ? of() : this.getAMTFeatures())),
        switchMap((results: AMTFeaturesResponse) => this.handleAMTFeaturesResponse(results)),
        switchMap((result: boolean | any) =>
          iif(
            () => result === false,
            defer(() => of(null)),
            defer(() => this.checkUserConsent())
          )
        ),
        switchMap((result: any) =>
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId(), result, 'SOL')
        ),
        switchMap((result: any) => this.postUserConsentDecision(result))
      )
      .subscribe()
      .add(() => {
        this.isLoading.set(false)
      })
  }

  postUserConsentDecision(result: boolean): Observable<any> {
    if (result != null && result) {
      this.readyToLoadSol = true
      this.getAMTFeatures()
    }
    return of(null)
  }

  connect(): void {
    this.devicesService.startwebSocket.emit(true)
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler() {
    this.disconnect()
  }

  disconnect(): void {
    this.devicesService.stopwebSocket.emit(true)
  }

  handlePowerState(powerState: any): Observable<any> {
    this.powerState = powerState
    // If device is not powered on, shows alert to power up device
    if (this.powerState.powerstate !== 2) {
      return this.showPowerUpAlert().pipe(
        switchMap((result) => {
          // if they said yes, power on the device
          if (result) {
            return this.devicesService.sendPowerAction(this.deviceId(), 2)
          }
          return of(null)
        })
      )
    }
    return of(true)
  }

  getPowerState(guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading.set(false)
        this.displayError($localize`Error retrieving power status`)
        return throwError(err)
      })
    )
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    this.amtFeatures = results
    if (this.amtFeatures.SOL) {
      return of(true)
    }
    return this.enableSolDialog().pipe(
      catchError((err) => {
        this.displayError($localize`Unable to display SOL dialog`)
        throw err
      }),
      switchMap((data?: boolean) => {
        if (data == null || !data) {
          // if clicked outside the dialog/or clicked "No", call to cancel previous requested user consent code
          this.cancelEnableSolResponse()
          return of(false)
        } else {
          const payload: AMTFeaturesRequest = {
            userConsent: this.amtFeatures?.userConsent ?? '',
            enableKVM: this.amtFeatures?.KVM ?? false,
            enableSOL: true,
            enableIDER: this.amtFeatures?.IDER ?? false,
            ocr: this.amtFeatures?.ocr ?? false,
            remoteErase: this.amtFeatures?.remoteErase ?? false
          }
          return this.devicesService.setAmtFeatures(this.deviceId(), payload)
        }
      })
    )
  }

  getAMTFeatures(): Observable<AMTFeaturesResponse> {
    this.isLoading.set(true)
    return this.devicesService.getAMTFeatures(this.deviceId())
  }

  enableSolDialog(): Observable<any> {
    // Open enable SOL dialog
    const userEnableSolDialog = this.dialog.open(DeviceEnableSolComponent, {
      height: '200px',
      width: '400px',
      data: { deviceId: this.deviceId(), results: this.results }
    })
    return userEnableSolDialog.afterClosed()
  }

  cancelEnableSolResponse(result?: boolean): void {
    this.isLoading.set(false)
    if (!result) {
      this.displayError($localize`SOL cannot be accessed - request to enable SOL is cancelled`)
    } else {
      this.displayError($localize`SOL cannot be accessed - failed to enable SOL`)
    }
    this.readyToLoadSol = false
  }

  showPowerUpAlert(): Observable<boolean> {
    const dialog = this.dialog.open(PowerUpAlertComponent)
    return dialog.afterClosed()
  }

  checkUserConsent(): Observable<any> {
    if (
      this.amtFeatures?.userConsent === 'none' ||
      this.amtFeatures?.optInState === 3 ||
      this.amtFeatures?.optInState === 4
    ) {
      this.readyToLoadSol = true
      return of(true)
    }
    return of(false)
  }

  deviceStatus(event: any): void {
    this.deviceState.set(event)
    if (event === 3) {
      this.isLoading.set(false)
    } else if (event === 0) {
      this.isLoading.set(false)
      if (!this.isDisconnecting) {
        this.displayError(
          'Connecting to SOL failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.'
        )
      }
      this.isDisconnecting = false
    }
  }

  stopSol(): void {
    this.deviceConnection.emit(false)
  }

  displayError(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }

  displayWarning(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultWarn)
  }
}
