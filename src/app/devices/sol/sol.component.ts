/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, OnDestroy } from '@angular/core'
import { ActivatedRoute, NavigationStart, Router } from '@angular/router'
import { defer, iif, Observable, of, Subscription, throwError } from 'rxjs'
import { catchError, finalize, switchMap, tap } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { environment } from 'src/environments/environment'
import {
  AMTFeaturesRequest,
  AMTFeaturesResponse,
  PowerState,
  UserConsentData,
  UserConsentResponse
} from 'src/models/models'
import { DeviceUserConsentComponent } from '../device-user-consent/device-user-consent.component'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { DeviceEnableSolComponent } from '../device-enable-sol/device-enable-sol.component'
import { SOLComponent } from '@open-amt-cloud-toolkit/ui-toolkit-angular'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { MatToolbar } from '@angular/material/toolbar'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatToolbar,
    MatIcon,
    DeviceToolbarComponent,
    MatButton,
    SOLComponent
  ]
})
export class SolComponent implements OnInit, OnDestroy {
  @Input()
  public deviceId = ''

  @Input()
  deviceState = 0

  @Output()
  deviceConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)

  results: any
  amtFeatures?: AMTFeaturesResponse
  isLoading = false
  powerState: PowerState = { powerstate: 0 }
  readyToLoadSol = false
  mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  authToken: string = environment.cloud ? '' : 'direct'
  isDisconnecting = false
  stopSocketSubscription!: Subscription
  startSocketSubscription!: Subscription

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly devicesService: DevicesService,
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private readonly router: Router
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
    // grab the device id from the url
    this.activatedRoute.params
      .pipe(
        switchMap((params) => {
          this.deviceId = params.id
          // request token from MPS
          return this.devicesService.getRedirectionExpirationToken(this.deviceId).pipe(
            tap((result) => {
              this.authToken = result.token
            })
          )
        })
      )
      .subscribe()

    // used for receiving messages from the sol connect button on the toolbar
    this.startSocketSubscription = this.devicesService.startwebSocket.subscribe((data: boolean) => {
      this.init()
      this.deviceConnection.emit(true)
    })

    // used for receiving messages from the sol disconnect button on the toolbar
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe((data: boolean) => {
      this.isDisconnecting = true
      this.deviceConnection.emit(false)
    })

    this.init()
  }

  init(): void {
    this.isLoading = true
    // device needs to be powered on in order to start SOL session
    this.getPowerState(this.deviceId)
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
        switchMap((result: any) => this.handleUserConsentDecision(result)),
        switchMap((result: any | UserConsentResponse) => this.handleUserConsentResponse(result))
      )
      .subscribe()
      .add(() => {
        this.isLoading = false
      })
  }
  connect(): void {
    this.devicesService.startwebSocket.emit(true)
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
            return this.devicesService.sendPowerAction(this.deviceId, 2)
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
        this.isLoading = false
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

  enableSolDialog(): Observable<any> {
    // Open enable SOL dialog
    const userEnableSolDialog = this.dialog.open(DeviceEnableSolComponent, {
      height: '200px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })
    return userEnableSolDialog.afterClosed()
  }

  cancelEnableSolResponse(result?: boolean): void {
    this.isLoading = false
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

  handleUserConsentDecision(result: any): Observable<any> {
    // if user consent is not required, ready to load SOL
    if (result == null || result === true) {
      return of(null)
    }
    //  If OptIn is SOL / All user consent is required
    //   //  3 - RECEIVED: user consent code was successfully entered by the IT operator.
    //   //  4 - IN SESSION: There is a Storage Redirection or SOL session open.
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
      this.displayError($localize`SOL cannot be accessed - failed to request user consent code`)
      return of(null)
    }
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
    const response: UserConsentResponse = data?.results
    // On success to send or cancel to previous requested user consent code
    const method = response.Header.Action.substring(
      response.Header.Action.lastIndexOf('/') + 1,
      response.Header.Action.length
    )
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

  cancelOptInCodeResponse(result: UserConsentResponse): void {
    this.isLoading = false
    if (result.Body?.ReturnValue === 0) {
      this.displayError($localize`SOL cannot be accessed - requested user consent code is cancelled`)
    } else {
      this.displayError($localize`SOL cannot be accessed - failed to cancel requested user consent code`)
    }
  }

  sendOptInCodeResponse(result: UserConsentResponse): void {
    if (result.Body?.ReturnValue === 0) {
      this.readyToLoadSol = true
    } else if (result.Body?.ReturnValue === 2066) {
      // On receiving an invalid consent code. Sending multiple invalid consent codes will cause the OptInState to return to NOT STARTED
      this.displayError($localize`SOL cannot be accessed - unsupported user consent code`)
      this.getAMTFeatures()
    } else {
      this.isLoading = false
      this.displayError($localize`SOL cannot be accessed - failed to send user consent code`)
    }
  }

  reqUserConsentCode(guid: string): Observable<UserConsentResponse> {
    return this.devicesService.reqUserConsentCode(guid).pipe(
      catchError((err) => {
        // Cannot access SOL if request to user consent code fails
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
          this.displayWarning($localize`SOL cannot be accessed - previously requested user consent code is cancelled`)
        } else {
          this.displayError($localize`SOL cannot be accessed - failed to cancel previous requested user content code`)
        }
      })
  }

  deviceStatus(event: any): void {
    this.deviceState = event
    if (event === 3) {
      this.isLoading = false
    } else if (event === 0) {
      this.isLoading = false
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
