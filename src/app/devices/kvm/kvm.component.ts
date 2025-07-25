/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
  input
} from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, NavigationStart, Router } from '@angular/router'
import { defer, iif, interval, Observable, of, Subscription, throwError } from 'rxjs'
import { catchError, mergeMap, switchMap, tap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { environment } from 'src/environments/environment'
import { AMTFeaturesRequest, AMTFeaturesResponse, RedirectionStatus, UserConsentResponse } from 'src/models/models'
import { DeviceEnableKvmComponent } from '../device-enable-kvm/device-enable-kvm.component'
import { KVMComponent, IDERComponent } from '@device-management-toolkit/ui-toolkit-angular'
import { MatProgressSpinner } from '@angular/material/progress-spinner'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { MatOption } from '@angular/material/core'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { MatFormField, MatLabel } from '@angular/material/form-field'
import { MatToolbar } from '@angular/material/toolbar'
import { UserConsentService } from '../user-consent.service'

@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    MatToolbar,
    MatFormField,
    MatLabel,
    MatSelect,
    ReactiveFormsModule,
    FormsModule,
    MatOption,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    KVMComponent,
    IDERComponent
  ]
})
export class KvmComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private readonly dialog = inject(MatDialog)
  private readonly devicesService = inject(DevicesService)
  private readonly activatedRoute = inject(ActivatedRoute)
  private readonly userConsentService = inject(UserConsentService)
  private readonly router = inject(Router)
  public readonly snackBar = inject(MatSnackBar)

  public readonly deviceId = input('')

  @Output()
  public deviceKVMConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)

  @Output()
  public deviceIDERConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)

  @Output()
  public selectedEncoding: EventEmitter<number> = new EventEmitter<number>()

  public isFullscreen = signal(false)
  public isLoading = signal(false)
  public deviceState = signal(-1)
  public mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  public readyToLoadKvm = false
  public authToken = signal('')
  public selected = 1
  public isIDERActive = false
  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public diskImage: File | null = null
  public isDisconnecting = false
  public redirectionStatus: RedirectionStatus | null = null

  private powerState: any = 0
  private stopSocketSubscription!: Subscription
  private startSocketSubscription!: Subscription
  private timeInterval!: any

  public encodings = [
    { value: 1, viewValue: 'RLE 8' },
    { value: 2, viewValue: 'RLE 16' }
  ]

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

  ngOnInit(): void {
    // request token from MPS
    this.devicesService
      .getRedirectionExpirationToken(this.deviceId())
      .pipe(
        tap((result) => {
          this.authToken.set(result.token)
        })
      )
      .subscribe()

    // used for receiving messages from the kvm connect button on the toolbar
    this.startSocketSubscription = this.devicesService.connectKVMSocket.subscribe(() => {
      this.init()
      this.deviceKVMConnection.emit(true)
    })

    // used for receiving messages from the kvm disconnect button on the toolbar
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe(() => {
      this.isDisconnecting = true
      this.deviceKVMConnection.emit(false)
    })

    // we need to get power state every 15 seconds to keep the KVM/mouse from freezing
    this.timeInterval = interval(15000)
      .pipe(mergeMap(() => this.getPowerState(this.deviceId())))
      .subscribe()

    this.init()
  }

  init(): void {
    this.isLoading.set(true)
    // device needs to be powered on in order to start KVM session
    this.getPowerState(this.deviceId())
      .pipe(
        switchMap((powerState) => this.handlePowerState(powerState)),
        switchMap((result) => (result === null ? of() : this.getRedirectionStatus(this.deviceId()))),
        switchMap((result: RedirectionStatus) => this.handleRedirectionStatus(result)),
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
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures()!)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId(), result, 'KVM')
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
      this.readyToLoadKvm = this.amtFeatures()?.kvmAvailable ?? false
      this.getAMTFeatures()
    } else if (result === false) {
      this.isLoading.set(false)
      this.deviceState.set(0)
    }
    return of(null)
  }

  @HostListener('document:fullscreenchange', ['$event'])
  @HostListener('document:webkitfullscreenchange', ['$event'])
  @HostListener('document:mozfullscreenchange', ['$event'])
  @HostListener('document:MSFullscreenChange', ['$event'])
  exitFullscreen(): void {
    if (
      !document.fullscreenElement &&
      !(document as any).webkitIsFullScreen &&
      !(document as any).mozFullScreen &&
      !(document as any).msFullscreenElement
    ) {
      this.toggleFullscreen()
    }
  }
  toggleFullscreen(): void {
    this.isFullscreen.set(!this.isFullscreen())
  }

  connect(): void {
    this.devicesService.connectKVMSocket.emit(true)
  }
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler() {
    this.disconnect()
  }
  disconnect(): void {
    this.devicesService.stopwebSocket.emit(true)
  }
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement
    this.diskImage = target.files?.[0] ?? null
    this.deviceIDERConnection.emit(true)
  }

  onCancelIDER(): void {
    // close the dialog, perform other actions as needed
    this.deviceIDERConnection.emit(false)
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

  getRedirectionStatus(guid: string): Observable<RedirectionStatus> {
    return this.devicesService.getRedirectionStatus(guid).pipe(
      catchError((err) => {
        this.isLoading.set(false)
        this.displayError($localize`Error retrieving redirection status`)
        return throwError(err)
      })
    )
  }

  handleRedirectionStatus(redirectionStatus: RedirectionStatus): Observable<any> {
    this.redirectionStatus = redirectionStatus
    if (this.amtFeatures()?.kvmAvailable && this.redirectionStatus.isKVMConnected) {
      this.displayError($localize`KVM cannot be accessed - another kvm session is in progress`)
      return of(null)
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
    this.amtFeatures.set(results)

    if (!this.amtFeatures()?.kvmAvailable) {
      return of(true)
    }

    if (this.amtFeatures()?.KVM) {
      return of(true)
    }
    return this.enableKvmDialog().pipe(
      catchError((err) => {
        this.displayError($localize`Unable to display KVM dialog`)
        throw err
      }),
      switchMap((data?: boolean) => {
        if (data == null || !data) {
          // if clicked outside the dialog/or clicked "No", call to cancel previous requested user consent code
          this.cancelEnableKvmResponse()
          return of(false)
        } else {
          const payload: AMTFeaturesRequest = {
            userConsent: this.amtFeatures()?.userConsent ?? '',
            enableKVM: true,
            enableSOL: this.amtFeatures()?.SOL ?? false,
            enableIDER: this.amtFeatures()?.IDER ?? false,
            ocr: this.amtFeatures()?.ocr ?? false,
            remoteErase: this.amtFeatures()?.remoteErase ?? false
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

  enableKvmDialog(): Observable<any> {
    // Open enable KVM dialog
    const userEnableKvmDialog = this.dialog.open(DeviceEnableKvmComponent, {
      height: '200px',
      width: '400px'
    })
    return userEnableKvmDialog.afterClosed()
  }

  cancelEnableKvmResponse(result?: boolean): void {
    this.isLoading.set(false)
    if (!result) {
      this.displayError($localize`KVM cannot be accessed - request to enable KVM is cancelled`)
    } else {
      this.displayError($localize`KVM cannot be accessed - failed to enable KVM`)
    }
    this.readyToLoadKvm = false
  }

  showPowerUpAlert(): Observable<boolean> {
    const dialog = this.dialog.open(PowerUpAlertComponent)
    return dialog.afterClosed()
  }

  checkUserConsent(): Observable<boolean> {
    if (
      this.amtFeatures()?.userConsent === 'none' ||
      this.amtFeatures()?.optInState === 3 ||
      this.amtFeatures()?.optInState === 4
    ) {
      this.readyToLoadKvm = true
      return of(true)
    }
    return of(false)
  }

  onEncodingChange = (e: number): void => {
    this.selectedEncoding.emit(e)
  }

  deviceKVMStatus = (event: any): void => {
    this.deviceState.set(event)
    if (event === 2) {
      this.isLoading.set(false)
    } else if (event === 0) {
      this.isLoading.set(false)
      if (!this.isDisconnecting) {
        this.displayError(
          'Connecting to KVM failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.'
        )
      }
      this.isDisconnecting = false
    }

    this.devicesService.deviceState.emit(this.deviceState())
  }

  deviceIDERStatus = (event: any): void => {
    if (event === 0) {
      this.isIDERActive = false
      this.displayWarning('IDER session ended')
    } else if (event === 3) {
      this.isIDERActive = true
      this.displayWarning('IDER session active')
    }
  }

  displayError(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }

  displayWarning(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultWarn)
  }

  ngOnDestroy(): void {
    this.isDisconnecting = true
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
