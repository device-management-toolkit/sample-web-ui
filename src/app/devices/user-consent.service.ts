import { Injectable, inject } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, finalize, switchMap } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DeviceUserConsentComponent } from './device-user-consent/device-user-consent.component'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { AMTFeaturesResponse, UserConsentData, UserConsentResponse } from 'src/models/models'
import { DevicesService } from './devices.service'

@Injectable({
  providedIn: 'root'
})
export class UserConsentService {
  private dialog = inject(MatDialog)
  private snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)

  handleUserConsentDecision(
    result: boolean | null,
    deviceId: string,
    amtFeatures: AMTFeaturesResponse | undefined
  ): Observable<any> {
    // if user consent is not required, ready to load KVM
    if (result == null || result) {
      return of(null)
    }
    //  If OptIn is KVM / All user consent is required
    //  3 - RECEIVED: user consent code was successfully entered by the IT operator.
    //  4 - IN SESSION: There is a Storage Redirection or KVM session open.
    if (amtFeatures?.optInState !== 3 && amtFeatures?.optInState !== 4) {
      return this.reqUserConsentCode(deviceId)
    }
    // This should handle optInState === 2
    // 2-DISPLAYED: the user consent code was displayed to the user.
    return of(true)
  }

  reqUserConsentCode(guid: string): Observable<UserConsentResponse> {
    return this.devicesService.reqUserConsentCode(guid).pipe(
      catchError((err) => {
        // Cannot access KVM if request to user consent code fails
        this.displayError($localize`Error requesting user consent code - retry after 3 minutes`)
        return of(err)
      })
    )
  }

  handleUserConsentResponse(deviceId: string, result: any | UserConsentResponse, featureName: string): Observable<any> {
    if (result == null) return of(null)
    // show user consent dialog if the user consent has been requested successfully
    // or if the user consent is already in session, or recieved, or displayed
    if (result === true || result.Body?.ReturnValue === 0) {
      return this.userConsentDialog(deviceId).pipe(
        switchMap((result: any) => {
          if (result == null) {
            // if clicked outside the dialog, call to cancel previous requested user consent code
            const response = this.cancelUserConsentCode(deviceId, featureName)
            return of(response)
          } else {
            const response = this.afterUserConsentDialogClosed(result as UserConsentData, featureName)
            return of(response)
          }
        })
      )
    } else {
      this.displayError(`${featureName} cannot be accessed - failed to request user consent code`)
      return of(null)
    }
  }

  userConsentDialog(deviceId: string): Observable<any> {
    // Open user consent dialog
    const userConsentDialog = this.dialog.open(DeviceUserConsentComponent, {
      height: '350px',
      width: '400px',
      data: { deviceId: deviceId }
    })

    return userConsentDialog.afterClosed()
  }

  afterUserConsentDialogClosed(data: UserConsentData, featureName: string): boolean {
    const response: UserConsentResponse = data?.results
    if (response.error != null) {
      this.displayError(`Unable to send code: ${response.error.Body.ReturnValueStr as string}`)
      return false
    } else {
      if (environment.cloud) {
        // On success to send or cancel to previous requested user consent code
        const method = response.Header.Action.substring(
          (response.Header.Action.lastIndexOf('/') as number) + 1,
          response.Header.Action.length
        )
        if (method === 'CancelOptInResponse') {
          this.cancelOptInCodeResponse(response as UserConsentResponse, featureName)
        } else if (method === 'SendOptInCodeResponse') {
          const result = this.sendOptInCodeResponse(response as UserConsentResponse, featureName)
          return result
        }
      } else {
        const method = (response as any).XMLName.Local
        if (method === 'CancelOptIn_OUTPUT') {
          this.cancelOptInCodeResponse({ Body: response } as any, featureName)
        } else if (method === 'SendOptInCode_OUTPUT') {
          const result = this.sendOptInCodeResponse({ Body: response } as any, featureName)
          return result
        }
      }
      return false
    }
  }

  getUserConsentMethod(response: UserConsentResponse): string {
    if (environment.cloud) {
      return response.Header.Action.substring(
        (response.Header.Action.lastIndexOf('/') as number) + 1,
        response.Header.Action.length
      )
    } else {
      return (response as any).XMLName.Local
    }
  }

  cancelOptInCodeResponse(result: UserConsentResponse, featureName: string): void {
    if (result.Body?.ReturnValue === 0) {
      this.displayError(`${featureName} cannot be accessed - requested user consent code is cancelled`)
    } else {
      this.displayError(`${featureName} cannot be accessed - failed to cancel requested user consent code`)
    }
  }

  sendOptInCodeResponse(result: UserConsentResponse, featureName: string): boolean {
    if (result.Body?.ReturnValue === 0) {
      return true
    } else if (result.Body?.ReturnValue === 2066) {
      this.displayError(`${featureName} cannot be accessed - unsupported user consent code`)
      return false
    } else {
      this.displayError(`${featureName} cannot be accessed - failed to send user consent code`)
      return false
    }
  }

  cancelUserConsentCode(guid: string, featureName: string): boolean {
    let result = false
    this.devicesService
      .cancelUserConsentCode(guid)
      .pipe(
        catchError((err) => {
          this.displayError(`Error cancelling user consent code`)
          return of(err)
        })
      )
      .subscribe((data: UserConsentResponse) => {
        if (data.Body?.ReturnValue === 0) {
          this.displayWarning(`${featureName} cannot be accessed - previously requested user consent code is cancelled`)
          result = true
        } else {
          this.displayError(`${featureName} cannot be accessed - failed to cancel previous requested user content code`)
        }
      })
    return result
  }

  displayError(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }

  displayWarning(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultWarn)
  }
}
