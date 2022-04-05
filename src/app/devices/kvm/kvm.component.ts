/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { interval, Observable, of, Subscription, throwError } from 'rxjs'
import { catchError, finalize, mergeMap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { environment } from 'src/environments/environment'
import { AuthService } from 'src/app/auth.service'
import { AmtFeaturesResponse, userConsentData, userConsentResponse } from 'src/models/models'
import { DeviceUserConsentComponent } from '../device-user-consent/device-user-consent.component'

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
      this.isLoading = true
      this.setAmtFeatures()
      this.deviceConnection.emit(true)
    })
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe(() => {
      this.deviceConnection.emit(false)
    })
    this.timeInterval = interval(15000).pipe(mergeMap(() => this.devicesService.getPowerState(this.deviceId))).subscribe()
    this.setAmtFeatures()
  }

  init (): void {
    this.getPowerState(this.deviceId).subscribe(data => {
      this.powerState = data
      if (this.powerState.powerstate !== 2) {
        // If device not power on, shows alert to power up device
        this.isLoading = false
        const dialog = this.dialog.open(PowerUpAlertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.isLoading = true
            this.devicesService.sendPowerAction(this.deviceId, 2).subscribe(data => {
              this.getAMTFeatures()
            })
          }
        })
      } else {
        this.getAMTFeatures()
      }
    })
  }

  getPowerState (guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.snackBar.open($localize`Error retrieving power status`, undefined, SnackbarDefaults.defaultError)
        this.isLoading = false
        return throwError(err)
      })
    )
  }

  setAmtFeatures (): void {
    this.devicesService.setAmtFeatures(this.deviceId)
      .pipe(catchError((err) => {
        // this.snackBar.open($localize`Unable to change user consent - code required for KVM in CCM`, undefined, SnackbarDefaults.defaultWarn)
        return of(err)
      }), finalize(() => {
        this.init()
      })).subscribe()
  }

  getAMTFeatures (): void {
    this.isLoading = true
    this.devicesService.getAMTFeatures(this.deviceId).subscribe(results => {
      this.amtFeatures = results
      this.checkUserConsent()
    }, err => {
      this.isLoading = false
      this.snackBar.open($localize`Error retrieving AMT Features`, undefined, SnackbarDefaults.defaultError)
      return throwError(err)
    })
  }

  checkUserConsent (): void {
    if (this.amtFeatures?.userConsent === 'none') {
      this.readyToLoadKvm = true
    } else {
      if (this.amtFeatures?.optInState === 2) {
        // 2-DISPLAYED: the user consent code was displayed to the user.
        this.userConsentDialog()
      } else if (this.amtFeatures?.optInState !== 3 && this.amtFeatures?.optInState !== 4) {
        //  If OptIn is KVM / All user consent is required
        //  3 - RECEIVED: user consent code was successfully entered by the IT operator.
        //  4 - IN SESSION: There is a Storage Redirection or KVM session open.
        this.reqUserConsentCode(this.deviceId).subscribe((data: userConsentResponse) => {
          if (data.Body?.ReturnValue === 0) {
            this.userConsentDialog()
          } else {
            this.isLoading = false
            this.snackBar.open($localize`KVM cannot be accessed - failed to request user consent code`, undefined, SnackbarDefaults.defaultError)
          }
        })
      } else if (this.amtFeatures?.optInState === 3 || this.amtFeatures?.optInState === 4) {
        this.readyToLoadKvm = true
      }
    }
  }

  userConsentDialog (): void {
    // Open user consent dialog
    const userConsentDialog = this.dialog.open(DeviceUserConsentComponent, {
      height: '300px',
      width: '400px',
      data: { deviceId: this.deviceId, results: this.results }
    })
    userConsentDialog.afterClosed().subscribe(data => {
      if (data == null) {
        // if clicked outside the dialog, call to cancel previous requested user consent code
        this.cancelUserConsentCode(this.deviceId)
      } else {
        this.afterUserContentDialogClosed(data)
      }
    })
  }

  afterUserContentDialogClosed (data: userConsentData): void {
    const response: userConsentResponse = data?.results
    // On success to send or cancel to previous requested user consent code
    const method = response.Header.Action.substring(response.Header.Action.lastIndexOf('/') + 1, response.Header.Action.length)
    if (method === 'CancelOptInResponse') {
      this.cancelOptInCodeResponse(response)
    } else if (method === 'SendOptInCodeResponse') {
      this.SendOptInCodeResponse(response)
    }
  }

  cancelOptInCodeResponse (result: userConsentResponse): void {
    this.isLoading = false
    if (result.Body?.ReturnValue === 0) {
      this.snackBar.open($localize`KVM cannot be accessed - requested user consent code is cancelled`, undefined, SnackbarDefaults.defaultError)
    } else {
      this.snackBar.open($localize`KVM cannot be accessed - failed to cancel requested user consent code`, undefined, SnackbarDefaults.defaultError)
    }
  }

  SendOptInCodeResponse (result: userConsentResponse): void {
    if (result.Body?.ReturnValue === 0) {
      this.readyToLoadKvm = true
      this.getAMTFeatures()
    } else if (result.Body?.ReturnValue === 2066) {
      // On receiving an invalid consent code. Sending multiple invalid consent codes will cause the OptInState to return to NOT STARTED
      this.snackBar.open($localize`KVM cannot be accessed - unsupported user consent code`, undefined, SnackbarDefaults.defaultError)
      this.getAMTFeatures()
    } else {
      this.isLoading = false
      this.snackBar.open($localize`KVM cannot be accessed - failed to send user consent code`, undefined, SnackbarDefaults.defaultError)
    }
  }

  reqUserConsentCode (guid: string): Observable<userConsentResponse> {
    return this.devicesService.reqUserConsentCode(guid).pipe(catchError((err) => {
      // Cannot access KVM if request to user consent code fails
      this.isLoading = false
      this.snackBar.open($localize`Error requesting user consent code - retry after 3 minutes`, undefined, SnackbarDefaults.defaultError)
      return of(err)
    }))
  }

  cancelUserConsentCode (guid: string): void {
    this.devicesService.cancelUserConsentCode(guid)
      .pipe(catchError((err) => {
        this.snackBar.open($localize`Error cancelling user consent code`, undefined, SnackbarDefaults.defaultError)
        return of(err)
      }), finalize(() => {
        this.isLoading = false
      })).subscribe((data: userConsentResponse) => {
        if (data.Body?.ReturnValue === 0) {
          this.snackBar.open($localize`KVM cannot be accessed - previously requested user consent code is cancelled`, undefined, SnackbarDefaults.defaultWarn)
        } else {
          this.snackBar.open($localize`KVM cannot be accessed - failed to cancel previous requested user content code`, undefined, SnackbarDefaults.defaultError)
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
      this.snackBar.open('Connecting to KVM failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.', undefined, SnackbarDefaults.defaultError)
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
