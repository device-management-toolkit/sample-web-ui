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
import { AmtFeaturesResponse, userConsentData, userConsentResponse } from 'src/models/models'
import { DeviceUserConsentComponent } from '../device-user-consent/device-user-consent.component'
import { DeviceEnableKvmComponent } from '../device-enable-kvm/device-enable-kvm.component'

@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss']
})
export class KvmComponent implements OnInit, OnDestroy {
  results: any
  isLoading: boolean = false
  deviceId: string = ''
  powerState: any = 0
  mpsServer: string = `${environment.mpsServer.replace('http', 'ws')}/relay`
  readyToLoadKvm: boolean = false
  authToken: string = ''
  timeInterval!: any
  selected: number = 1
  isDisconnecting: boolean = false
  @Input() deviceState: number = 0
  @Output() deviceConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)
  @Output() selectedEncoding: EventEmitter<number> = new EventEmitter<number>()
  stopSocketSubscription!: Subscription
  startSocketSubscription!: Subscription
  amtFeatures?: AmtFeaturesResponse

  encodings = [
    { value: 1, viewValue: 'RLE 8' },
    { value: 2, viewValue: 'RLE 16' }
  ]

  constructor (public snackBar: MatSnackBar,
    public dialog: MatDialog,
    private readonly devicesService: DevicesService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly router: Router) {
    if (environment.mpsServer.includes('/mps')) { // handles kong route
      this.mpsServer = `${environment.mpsServer.replace('http', 'ws')}/ws/relay`
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isDisconnecting = true
      }
    })
  }

  ngOnInit (): void {
    // grab the device id from the url
    this.activatedRoute.params.pipe(
      switchMap(params => {
        this.deviceId = params.id
        // request token from MPS
        return this.devicesService.getRedirectionExpirationToken(this.deviceId).pipe(
          tap((result) => {
            this.authToken = result.token
          })
        )
      })
    ).subscribe()

    // used for receiving messages from the kvm connect button on the toolbar
    this.startSocketSubscription = this.devicesService.connectKVMSocket.subscribe((data: boolean) => {
      this.init()
      this.deviceConnection.emit(true)
    })

    // used for receiving messages from the kvm disconnect button on the toolbar
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe((data: boolean) => {
      this.isDisconnecting = true
      this.deviceConnection.emit(false)
      void this.router.navigate([`/devices/${this.deviceId}`])
    })

    // we need to get power state every 15 seconds to keep the KVM/mouse from freezing
    this.timeInterval = interval(15000).pipe(
      mergeMap(() => this.getPowerState(this.deviceId))
    ).subscribe()

    this.init()
  }

  init (): void {
    this.isLoading = true
    // device needs to be powered on in order to start KVM session
    this.getPowerState(this.deviceId).pipe(
      switchMap((powerState) => this.handlePowerState(powerState)),
      switchMap((result) => result === null ? of() : this.getAMTFeatures()),
      switchMap((results: AmtFeaturesResponse) => this.handleAMTFeaturesResponse(results)),
      switchMap((result: boolean | any) =>
        iif(() => result === false,
        defer(() => of(null)),
        defer(() => this.checkUserConsent())
        )),
      switchMap((result: any) => this.handleUserConsentDecision(result)),
      switchMap((result: any | userConsentResponse) => this.handleUserConsentResponse(result))
    ).subscribe().add(() => {
      this.isLoading = false
    })
  }

  handlePowerState (powerState: any): Observable<any> {
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

  getPowerState (guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading = false
        this.displayError($localize`Error retrieving power status`)
        return throwError(err)
      })
    )
  }

  handleAMTFeaturesResponse (results: AmtFeaturesResponse): Observable<any> {
    this.amtFeatures = results
    if (this.amtFeatures.KVM) {
      return of(true)
    }
    return this.enableKvmDialog()
      .pipe(
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
              const payload = {
                userConsent: this.amtFeatures?.userConsent as string,
                enableKVM: true,
                enableSOL: this.amtFeatures?.SOL as boolean,
                enableIDER: this.amtFeatures?.IDER as boolean
              }
              return this.devicesService.setAmtFeatures(this.deviceId, payload)
          }
        })
      )
  }

  getAMTFeatures (): Observable<AmtFeaturesResponse> {
    this.isLoading = true
    return this.devicesService.getAMTFeatures(this.deviceId)
  }

  enableKvmDialog (): Observable<any> {
    // Open enable KVM dialog
    const userEnableKvmDialog = this.dialog.open(DeviceEnableKvmComponent, {
      height: '200px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })
    return userEnableKvmDialog.afterClosed()
  }

  cancelEnableKvmResponse (result?: boolean): void {
    this.isLoading = false
    if (!result) {
      this.displayError($localize`KVM cannot be accessed - request to enable KVM is cancelled`)
    } else {
      this.displayError($localize`KVM cannot be accessed - failed to enable KVM`)
    }
    this.readyToLoadKvm = false
  }

  showPowerUpAlert (): Observable<boolean> {
    const dialog = this.dialog.open(PowerUpAlertComponent)
    return dialog.afterClosed()
  }

  handleUserConsentDecision (result: any): Observable<any> {
    // if user consent is not required, ready to load KVM
    if (result == null || result === true) {
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

  handleUserConsentResponse (result: any | userConsentResponse): Observable<any> {
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
              this.afterUserConsentDialogClosed(result)
            }
          return of(null)
        })
      )
    } else {
      this.displayError($localize`KVM cannot be accessed - failed to request user consent code`)
      return of(null)
    }
  }

  checkUserConsent (): Observable<any> {
    if (this.amtFeatures?.userConsent === 'none' || this.amtFeatures?.optInState === 3 || this.amtFeatures?.optInState === 4) {
      this.readyToLoadKvm = true
      return of(true)
    }
    return of(false)
  }

  userConsentDialog (): Observable<any> {
    // Open user consent dialog
    const userConsentDialog = this.dialog.open(DeviceUserConsentComponent, {
      height: '350px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })

    return userConsentDialog.afterClosed()
  }

  afterUserConsentDialogClosed (data: userConsentData): void {
    const response: userConsentResponse | any = data?.results
    if (response.error != null) {
      this.displayError(`Unable to send code: ${response.error.Body.ReturnValueStr as string}`)
      this.isLoading = false
    } else {
    // On success to send or cancel to previous requested user consent code
    const method = response.Header.Action.substring((response.Header.Action.lastIndexOf('/') as number) + 1, response.Header.Action.length)
    if (method === 'CancelOptInResponse') {
        this.cancelOptInCodeResponse(response)
      } else if (method === 'SendOptInCodeResponse') {
        this.sendOptInCodeResponse(response)
      }
    }
  }

  cancelOptInCodeResponse (result: userConsentResponse): void {
    this.isLoading = false
    if (result.Body?.ReturnValue === 0) {
      this.displayError($localize`KVM cannot be accessed - requested user consent code is cancelled`)
    } else {
      this.displayError($localize`KVM cannot be accessed - failed to cancel requested user consent code`)
    }
  }

  sendOptInCodeResponse (result: userConsentResponse): void {
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

  reqUserConsentCode (guid: string): Observable<userConsentResponse> {
    return this.devicesService.reqUserConsentCode(guid).pipe(catchError((err) => {
      // Cannot access KVM if request to user consent code fails
      this.isLoading = false
      this.displayError($localize`Error requesting user consent code - retry after 3 minutes`)
      return of(err)
    }))
  }

  cancelUserConsentCode (guid: string): void {
    this.devicesService.cancelUserConsentCode(guid)
      .pipe(catchError((err) => {
        this.displayError($localize`Error cancelling user consent code`)
        return of(err)
      }), finalize(() => {
        this.isLoading = false
      })).subscribe((data: userConsentResponse) => {
        if (data.Body?.ReturnValue === 0) {
          this.displayWarning($localize`KVM cannot be accessed - previously requested user consent code is cancelled`)
        } else {
          this.displayError($localize`KVM cannot be accessed - failed to cancel previous requested user content code`)
        }
      })
  }

  onEncodingChange = (e: any): void => {
    this.selectedEncoding.emit(e)
  }

  deviceStatus = (event: any): void => {
    this.deviceState = event
    if (event === 2) {
      this.isLoading = false
    } else if (event === 0) {
      this.isLoading = false
      if (!this.isDisconnecting) {
        this.displayError('Connecting to KVM failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.')
      }
      this.isDisconnecting = false
    }
  }

  displayError (message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }

  displayWarning (message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultWarn)
  }

  ngOnDestroy (): void {
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
