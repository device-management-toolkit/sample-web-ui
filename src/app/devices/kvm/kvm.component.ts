/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, NavigationStart, Router } from '@angular/router'
import { defer, iif, interval, Observable, of, Subscription, throwError } from 'rxjs'
import { catchError, finalize, mergeMap, switchMap, tap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { environment } from 'src/environments/environment'
import {
  AMTFeaturesRequest,
  AMTFeaturesResponse,
  RedirectionStatus,
  UserConsentData,
  UserConsentResponse
} from 'src/models/models'
import { DeviceUserConsentComponent } from '../device-user-consent/device-user-consent.component'
import { DeviceEnableKvmComponent } from '../device-enable-kvm/device-enable-kvm.component'
import { KVMComponent, IDERComponent } from '@open-amt-cloud-toolkit/ui-toolkit-angular'
import { MatProgressSpinner } from '@angular/material/progress-spinner'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { MatOption } from '@angular/material/core'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { MatFormField, MatLabel } from '@angular/material/form-field'
import { MatToolbar } from '@angular/material/toolbar'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'

@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss'],
  standalone: true,
  imports: [
    DeviceToolbarComponent,
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
  @Input()
  public deviceId = ''

  @Output()
  deviceKVMConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)

  @Output()
  deviceIDERConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)

  @Output()
  selectedEncoding: EventEmitter<number> = new EventEmitter<number>()

  deviceState = 0
  results: any
  isLoading = false
  powerState: any = 0
  mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  readyToLoadKvm = false
  authToken: string = environment.cloud ? '' : 'direct'
  timeInterval!: any
  selected = 1
  isDisconnecting = false
  isIDERActive = false

  stopSocketSubscription!: Subscription
  startSocketSubscription!: Subscription
  amtFeatures?: AMTFeaturesResponse
  // IDER FEATURES
  diskImage: File | null = null
  redirectionStatus: RedirectionStatus | null = null

  encodings = [
    { value: 1, viewValue: 'RLE 8' },
    { value: 2, viewValue: 'RLE 16' }
  ]

  constructor(
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private readonly devicesService: DevicesService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly router: Router
  ) {
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
    // grab the device id from the url
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.deviceId = params.id
          if (environment.cloud) {
            // request token from MPS
            return this.devicesService.getRedirectionExpirationToken(this.deviceId).pipe(
              tap((result) => {
                this.authToken = result.token
              })
            )
          } else {
            return of()
          }
        })
      )
      .subscribe()

    // used for receiving messages from the kvm connect button on the toolbar
    this.startSocketSubscription = this.devicesService.connectKVMSocket.subscribe((data: boolean) => {
      this.init()
      this.deviceKVMConnection.emit(true)
    })

    // used for receiving messages from the kvm disconnect button on the toolbar
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe((data: boolean) => {
      this.isDisconnecting = true
      this.deviceKVMConnection.emit(false)
      void this.router.navigate([`/devices/${this.deviceId}`])
    })

    // we need to get power state every 15 seconds to keep the KVM/mouse from freezing
    this.timeInterval = interval(15000)
      .pipe(mergeMap(() => this.getPowerState(this.deviceId)))
      .subscribe()

    this.init()
  }

  init(): void {
    this.isLoading = true
    // switchMap((result: RedirectionStatus) => result === null ? of() : this.getRedirectionStatus(this.deviceId)),
    // switchMap((result) => this.handleRedirectionStatus(result)),
    // device needs to be powered on in order to start KVM session
    this.getPowerState(this.deviceId)
      .pipe(
        switchMap((powerState) => this.handlePowerState(powerState)),
        switchMap((result) => (result === null ? of() : this.getRedirectionStatus(this.deviceId))),
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
        switchMap((result: boolean | null) => this.handleUserConsentDecision(result)),
        switchMap((result: any | UserConsentResponse) => this.handleUserConsentResponse(result))
      )
      .subscribe()
      .add(() => {
        this.isLoading = false
      })
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
            return this.devicesService.sendPowerAction(this.deviceId, 2)
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
        this.isLoading = false
        this.displayError($localize`Error retrieving redirection status`)
        return throwError(err)
      })
    )
  }

  handleRedirectionStatus(redirectionStatus: RedirectionStatus): Observable<any> {
    this.redirectionStatus = redirectionStatus
    if (this.redirectionStatus.isKVMConnected) {
      this.displayError($localize`KVM cannot be accessed - another kvm session is in progress`)
      return of(null)
    }
    return of(true)
  }

  getPowerState(guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading = false
        this.displayError($localize`Error retrieving power status`)
        return throwError(err)
      })
    )
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    this.amtFeatures = results
    if (this.amtFeatures.KVM) {
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
            userConsent: this.amtFeatures?.userConsent ?? '',
            enableKVM: true,
            enableSOL: this.amtFeatures?.SOL ?? false,
            enableIDER: this.amtFeatures?.IDER ?? false
          }
          return this.devicesService.setAmtFeatures(this.deviceId, payload)
        }
      })
    )
  }

  getAMTFeatures(): Observable<AMTFeaturesResponse> {
    this.isLoading = true
    return this.devicesService.getAMTFeatures(this.deviceId)
  }

  enableKvmDialog(): Observable<any> {
    // Open enable KVM dialog
    const userEnableKvmDialog = this.dialog.open(DeviceEnableKvmComponent, {
      height: '200px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })
    return userEnableKvmDialog.afterClosed()
  }

  cancelEnableKvmResponse(result?: boolean): void {
    this.isLoading = false
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

  handleUserConsentDecision(result: boolean | null): Observable<any> {
    // if user consent is not required, ready to load KVM
    if (result == null || result) {
      return of(null)
    }
    //  If OptIn is KVM / All user consent is required
    //   //  3 - RECEIVED: user consent code was successfully entered by the IT operator.
    //   //  4 - IN SESSION: There is a Storage Redirection or KVM session open.
    if (this.amtFeatures?.optInState !== 3 && this.amtFeatures?.optInState !== 4) {
      return this.reqUserConsentCode(this.deviceId)
    }
    // This should handle optInState === 2
    // 2-DISPLAYED: the user consent code was displayed to the user.
    return of(true)
  }

  handleUserConsentResponse(result: any | UserConsentResponse): Observable<any> {
    if (result == null) return of(null)

    // show user consent dialog if the user consent has been requested successfully
    // or if the user consent is already in session, or recieved, or displayed
    if (result === true || result.Body?.ReturnValue === 0) {
      return this.userConsentDialog().pipe(
        switchMap((result: any) => {
          if (result == null) {
            // if clicked outside the dialog, call to cancel previous requested user consent code
            this.cancelUserConsentCode(this.deviceId)
          } else {
            this.afterUserConsentDialogClosed(result as UserConsentData)
          }
          return of(null)
        })
      )
    } else {
      this.displayError($localize`KVM cannot be accessed - failed to request user consent code`)
      return of(null)
    }
  }

  checkUserConsent(): Observable<boolean> {
    if (
      this.amtFeatures?.userConsent === 'none' ||
      this.amtFeatures?.optInState === 3 ||
      this.amtFeatures?.optInState === 4
    ) {
      this.readyToLoadKvm = true
      return of(true)
    }
    return of(false)
  }

  userConsentDialog(): Observable<any> {
    // Open user consent dialog
    const userConsentDialog = this.dialog.open(DeviceUserConsentComponent, {
      height: '350px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })

    return userConsentDialog.afterClosed()
  }

  afterUserConsentDialogClosed(data: UserConsentData): void {
    const response: UserConsentResponse | any = data?.results
    if (response.error != null) {
      this.displayError(`Unable to send code: ${response.error.Body.ReturnValueStr as string}`)
      this.isLoading = false
    } else {
      if (environment.cloud) {
        // On success to send or cancel to previous requested user consent code
        const method = response.Header.Action.substring(
          (response.Header.Action.lastIndexOf('/') as number) + 1,
          response.Header.Action.length
        )
        if (method === 'CancelOptInResponse') {
          this.cancelOptInCodeResponse(response as UserConsentResponse)
        } else if (method === 'SendOptInCodeResponse') {
          this.sendOptInCodeResponse(response as UserConsentResponse)
        }
      } else {
        const method = (response as any).XMLName.Local
        if (method === 'CancelOptIn_OUTPUT') {
          this.cancelOptInCodeResponse({
            Body: response
          } as any)
        } else if (method === 'SendOptInCode_OUTPUT') {
          this.sendOptInCodeResponse({
            Body: response
          } as any)
        }
      }
    }
  }

  cancelOptInCodeResponse(result: UserConsentResponse): void {
    this.isLoading = false
    if (result.Body?.ReturnValue === 0) {
      this.displayError($localize`KVM cannot be accessed - requested user consent code is cancelled`)
    } else {
      this.displayError($localize`KVM cannot be accessed - failed to cancel requested user consent code`)
    }
  }

  sendOptInCodeResponse(result: UserConsentResponse): void {
    if (result.Body?.ReturnValue === 0) {
      this.readyToLoadKvm = true
      this.getAMTFeatures()
    } else if (result.Body?.ReturnValue === 2066) {
      // On receiving an invalid consent code. Sending multiple invalid consent codes will cause the OptInState to return to NOT STARTED
      this.displayError($localize`KVM cannot be accessed - unsupported user consent code`)
      this.getAMTFeatures()
    } else {
      this.isLoading = false
      this.displayError($localize`KVM cannot be accessed - failed to send user consent code`)
    }
  }

  reqUserConsentCode(guid: string): Observable<UserConsentResponse> {
    return this.devicesService.reqUserConsentCode(guid).pipe(
      catchError((err) => {
        // Cannot access KVM if request to user consent code fails
        this.isLoading = false
        this.displayError($localize`Error requesting user consent code - retry after 3 minutes`)
        return of(err)
      })
    )
  }

  cancelUserConsentCode(guid: string): void {
    this.devicesService
      .cancelUserConsentCode(guid)
      .pipe(
        catchError((err) => {
          this.displayError($localize`Error cancelling user consent code`)
          return of(err)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe((data: UserConsentResponse) => {
        if (data.Body?.ReturnValue === 0) {
          this.displayWarning($localize`KVM cannot be accessed - previously requested user consent code is cancelled`)
        } else {
          this.displayError($localize`KVM cannot be accessed - failed to cancel previous requested user content code`)
        }
      })
  }

  onEncodingChange = (e: number): void => {
    this.selectedEncoding.emit(e)
  }

  deviceKVMStatus = (event: any): void => {
    this.deviceState = event
    if (event === 2) {
      this.isLoading = false
    } else if (event === 0) {
      this.isLoading = false
      if (!this.isDisconnecting) {
        this.displayError(
          'Connecting to KVM failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.'
        )
      }
      this.isDisconnecting = false
    }
    this.devicesService.deviceState.emit(this.deviceState)
  }

  deviceIDERStatus = (event: any): void => {
    if (event === 0) {
      this.isIDERActive = false
    } else if (event === 3) {
      this.isIDERActive = true
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
