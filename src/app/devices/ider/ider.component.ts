/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit, inject, signal, input } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NavigationStart, Router } from '@angular/router'
import { defer, EMPTY, iif, Observable, of, throwError } from 'rxjs'
import { catchError, switchMap, tap } from 'rxjs/operators'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { PowerUpAlertComponent } from '../../shared/power-up-alert/power-up-alert.component'
import { environment } from '../../../environments/environment'
import { AMTFeaturesRequest, AMTFeaturesResponse, RedirectionStatus, UserConsentResponse } from '../../../models/models'
import { DeviceEnableIderComponent } from '../device-enable-ider/device-enable-ider.component'
import { IDERComponent } from '@device-management-toolkit/ui-toolkit-angular'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatToolbar } from '@angular/material/toolbar'
import { UserConsentService } from '../user-consent.service'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-ider',
  templateUrl: './ider.component.html',
  styleUrls: ['./ider.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    MatToolbar,
    ReactiveFormsModule,
    FormsModule,
    MatButton,
    MatIcon,
    IDERComponent,
    TranslatePipe
  ]
})
export class IderComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private readonly dialog = inject(MatDialog)
  private readonly devicesService = inject(DevicesService)
  private readonly userConsentService = inject(UserConsentService)
  private readonly router = inject(Router)
  public readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)

  public readonly deviceId = input('')

  public deviceIDERConnection = signal(false)

  public selectedEncoding = signal(1)

  public isFullscreen = signal(false)
  public isLoading = signal(false)
  public loadingStatus = signal('')
  public deviceState = signal(-1)
  public mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  public authToken = signal('')
  public selectedHotkey: string | null = null
  public isIDERActive = signal(false)
  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public diskImage: File | null = null
  public isDisconnecting = false
  public redirectionStatus: RedirectionStatus | null = null
  public hotKeySignal = signal<any>(null)
  public displays: { value: number; viewValue: string; disabled: boolean }[] = []
  public selectedDisplay = signal(0)

  private powerState: any = 0
  private timeInterval!: any
  private initStartTime = 0
  // If init() completes faster than this, we assume no blocking dialog was
  // shown and the token fetched in ngOnInit is still valid.
  private readonly REDIR_TOKEN_REFRESH_THRESHOLD_MS = environment.redirTokenRefreshThresholdMs ?? 5_000

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
    this.prefetchAuthToken()

    this.init()
  }

  // Prefetch a redirection token in parallel with init() so the fast path (no
  // blocking dialogs) doesn't pay a round-trip in postUserConsentDecision.
  private prefetchAuthToken(): void {
    this.devicesService
      .getRedirectionExpirationToken(this.deviceId())
      .pipe(tap((result) => this.authToken.set(result.token)))
      .subscribe()
  }

  init(): void {
    this.initStartTime = Date.now()
    this.isLoading.set(true)
    // Kick off the connection chain immedicately do AMT round-trips can begin without delay.
    this.loadingStatus.set('ider.status.checkingPowerState.value')
    this.getPowerStateCached(this.deviceId())
      .pipe(
        tap(() => this.loadingStatus.set('ider.status.checkingRedirection.value')),
        switchMap((powerState) => this.handlePowerState(powerState)),
        switchMap((result) => {
          if (result === null) {
            this.isLoading.set(false)
            this.loadingStatus.set('')
            return EMPTY
          }
          return this.getRedirectionStatus(this.deviceId())
        }),
        tap(() => this.loadingStatus.set('ider.status.checkingAMTFeatures.value')),
        switchMap((result: RedirectionStatus) => this.handleRedirectionStatus(result)),
        switchMap((result) => {
          if (result === null) {
            this.isLoading.set(false)
            this.loadingStatus.set('')
            return EMPTY
          }
          return this.getAMTFeaturesCached()
        }),
        switchMap((results: AMTFeaturesResponse) => this.handleAMTFeaturesResponse(results)),
        tap(() => this.loadingStatus.set('ider.status.checkingConsent.value')),
        switchMap((result: boolean | any) =>
          iif(
            () => result === false,
            defer(() => of(null)),
            defer(() => this.checkUserConsent())
          )
        ),
        switchMap((result: any) =>
          // safely convert null to undefined for type compatibility
          this.userConsentService.handleUserConsentDecision(result, this.deviceId(), this.amtFeatures() ?? undefined)
        ),
        switchMap((result: any | UserConsentResponse) =>
          this.userConsentService.handleUserConsentResponse(this.deviceId(), result, 'IDER')
        ),
        switchMap((result: any) => this.postUserConsentDecision(result)),
        catchError((err) => {
          this.isLoading.set(false)
          this.loadingStatus.set('')
          return throwError(() => err)
        })
      )
      .subscribe()
  }

  postUserConsentDecision(result: boolean): Observable<any> {
    if (result === false) {
      this.isLoading.set(false)
      this.loadingStatus.set('')
      this.deviceState.set(0)
      return of(null)
    }
    // If no dialog blocked the init() chain long enough to expire the token
    // prefetched in ngOnInit, skip the refresh round-trip and use it directly.
    const elapsedMs = Date.now() - this.initStartTime
    if (elapsedMs < this.REDIR_TOKEN_REFRESH_THRESHOLD_MS && this.authToken()) {
      this.isDisconnecting = false
      this.loadingStatus.set('ider.status.connectingIder.value')
      return of(null)
    }
    // The init() chain was blocked on a dialog long enough that the prefetched
    // token may have expired. Refresh it so <amt-ider> opens the websocket with
    // a fresh token.
    return this.devicesService.getRedirectionExpirationToken(this.deviceId()).pipe(
      tap((token) => {
        this.authToken.set(token.token)
        this.isDisconnecting = false
        this.loadingStatus.set('ider.status.connectingIder.value')
      })
    )
  }

  checkUserConsent(): Observable<boolean> {
    if (
      this.amtFeatures()?.userConsent === 'none' ||
      this.amtFeatures()?.optInState === 3 ||
      this.amtFeatures()?.optInState === 4
    ) {
      return of(true)
    }
    return of(false)
  }

  connect(): void {
    this.deviceState.set(-1)
    this.prefetchAuthToken()
    this.init()
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement
    this.diskImage = target.files?.[0] ?? null
    // Set the deviceIDERConnection signal based on whether a file is selected
    this.deviceIDERConnection.set(this.diskImage !== null)
  }

  onCancelIDER(): void {
    // close the dialog, perform other actions as needed
    this.deviceIDERConnection.set(false)
    this.isIDERActive.set(false)
    this.diskImage = null
    // Clear the file input so the same file can be selected again
    const fileInput = document.getElementById('file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  onDisplayChange = (e: number): void => {
    this.selectedDisplay.set(e)
    // optionally notify backend of selection
    this.devicesService.setDisplaySelection(this.deviceId(), { displayIndex: e }).subscribe()
  }

  sendHotkey(): void {
    if (this.selectedHotkey) {
      this.hotKeySignal.set(this.selectedHotkey)
      // Reset the signal after a short delay to allow the same hotkey to be sent again
      setTimeout(() => {
        this.hotKeySignal.set(null)
      }, 100)
    }
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
        const msg: string = this.translate.instant('ider.errorRetrieve.value')
        this.displayError(msg)
        return throwError(() => err)
      })
    )
  }

  handleRedirectionStatus(redirectionStatus: RedirectionStatus): Observable<any> {
    this.redirectionStatus = redirectionStatus
    if (this.redirectionStatus.isIDERConnected) {
      const msg: string = this.translate.instant('warning.iderActive.value')
      this.displayWarning(msg)
      return of(null)
    }
    return of(true)
  }

  getPowerState(guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading.set(false)
        const msg: string = this.translate.instant('ider.errorRetrieve.value')
        this.displayError(msg)
        return throwError(() => err)
      })
    )
  }

  getPowerStateCached(guid: string): Observable<any> {
    return this.devicesService.getPowerStateCached(guid).pipe(
      catchError((err) => {
        this.isLoading.set(false)
        const msg: string = this.translate.instant('ider.errorRetrieve.value')
        this.displayError(msg)
        return throwError(() => err)
      })
    )
  }

  handleAMTFeaturesResponse(results: AMTFeaturesResponse): Observable<any> {
    this.amtFeatures.set(results)
    if (this.amtFeatures()?.redirection && this.amtFeatures()?.IDER) {
      return of(true)
    }
    return this.enableIderDialog().pipe(
      catchError((err) => {
        const msg: string = this.translate.instant('ider.errorRetrieve.value')
        this.displayError(msg)
        throw err
      }),
      switchMap((data?: boolean) => {
        if (data == null || !data) {
          // if clicked outside the dialog/or clicked "No", call to cancel previous requested user consent code
          this.cancelEnableIderResponse()
          return of(false)
        } else {
          const payload: AMTFeaturesRequest = {
            userConsent: this.amtFeatures()?.userConsent ?? '',
            enableKVM: this.amtFeatures()?.KVM ?? false,
            enableSOL: this.amtFeatures()?.SOL ?? false,
            enableIDER: true,
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

  getAMTFeaturesCached(): Observable<AMTFeaturesResponse> {
    this.isLoading.set(true)
    return this.devicesService.getAMTFeaturesCached(this.deviceId())
  }

  showPowerUpAlert(): Observable<boolean> {
    const dialog = this.dialog.open(PowerUpAlertComponent)
    return dialog.afterClosed()
  }

  deviceIDERStatus = (event: any): void => {
    if (event === 0) {
      this.isIDERActive.set(false)
      this.displayWarning(this.translate.instant('warning.iderEnded.value'))
    } else if (event === 3) {
      this.isIDERActive.set(true)
      this.displayWarning(this.translate.instant('warning.iderActive.value'))
    }
  }

  enableIderDialog(): Observable<any> {
    // Open enable IDER dialog
    const userEnableIderDialog = this.dialog.open(DeviceEnableIderComponent, {
      height: '200px',
      width: '400px'
    })
    return userEnableIderDialog.afterClosed()
  }

  cancelEnableIderResponse(result?: boolean): void {
    this.isLoading.set(false)
    if (!result) {
      const msg: string = this.translate.instant('ider.errorAccessCancel.value')
      this.displayError(msg)
    } else {
      const msg: string = this.translate.instant('ider.errorAccessEnable.value')
      this.displayError(msg)
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
  }
}
