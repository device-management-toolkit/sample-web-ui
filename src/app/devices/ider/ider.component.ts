/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CUSTOM_ELEMENTS_SCHEMA, Component, DestroyRef, OnDestroy, OnInit, inject, signal, input } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NavigationStart, Router } from '@angular/router'
import { EMPTY, Observable, of, throwError } from 'rxjs'
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
  private readonly destroyRef = inject(DestroyRef)

  public readonly deviceId = input('')

  public deviceIDERConnection = signal(false)

  public isLoading = signal(false)
  public loadingStatus = signal('')
  public deviceState = signal(-1)
  public mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  public authToken = signal('')
  public isIDERActive = signal(false)
  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public diskImage: File | null = null
  public isDisconnecting = false
  public redirectionStatus: RedirectionStatus | null = null

  private powerState: any = 0
  private initStartTime = 0
  private awaitingDiskSelection = false
  private diskSelectionCanceled = false
  // If init() completes faster than this, we assume no blocking dialog was
  // shown and the token prefetched at connect()time is still valid.
  private readonly REDIR_TOKEN_REFRESH_THRESHOLD_MS = environment.redirTokenRefreshThresholdMs ?? 5_000

  constructor() {
    if (environment.mpsServer.includes('/mps')) {
      // handles kong route
      this.mpsServer = `${environment.mpsServer.replace('http', 'ws')}/ws/relay`
    }
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isDisconnecting = true
      }
    })
  }

  ngOnInit(): void {
    this.promptEnableIderIfNeeded()
  }

  private promptEnableIderIfNeeded(): void {
    this.devicesService
      .getAMTFeaturesCached(this.deviceId())
      .pipe(
        switchMap((results: AMTFeaturesResponse) => this.handleAMTFeaturesResponse(results)),
        catchError(() => {
          const msg: string = this.translate.instant('ider.errorRetrieve.value')
          this.displayError(msg)
          return EMPTY
        })
      )
      .subscribe()
  }

  // Prefetch a redirection token in parallel with init() so the fast path (no
  // blocking dialogs) doesn't pay a round-trip in postUserConsentDecision.
  private prefetchAuthToken(): void {
    this.devicesService
      .getRedirectionExpirationToken(this.deviceId())
      .pipe(
        tap((result) => this.authToken.set(result.token)),
        catchError(() => EMPTY)
      )
      .subscribe()
  }

  init(): void {
    this.initStartTime = Date.now()
    this.isLoading.set(true)
    // Kick off the connection chain immediately so AMT round-trips can begin without delay.
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
        switchMap((result: boolean | any) => {
          if (result === false) {
            this.isLoading.set(false)
            this.loadingStatus.set('')
            return EMPTY
          }
          return this.checkUserConsent()
        }),
        switchMap((result: any) =>
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
      .subscribe({ error: () => undefined })
  }

  postUserConsentDecision(result: boolean): Observable<any> {
    // If file selection was canceled, stop the connect flow cleanly.
    if (this.diskSelectionCanceled) {
      this.diskSelectionCanceled = false
      this.isLoading.set(false)
      this.loadingStatus.set('')
      return of(null)
    }

    if (result === false) {
      this.isLoading.set(false)
      this.loadingStatus.set('')
      this.deviceState.set(0)
      return of(null)
    }
    // If no dialog blocked the init() chain long enough to expire the token
    // prefetched in connect(), skip the refresh round-trip and use it directly.
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

  onAttachDiskImage(fileInput: HTMLInputElement): void {
    if (this.isIDERActive()) {
      this.displayWarning(this.translate.instant('ider.alreadyActiveWarning.value'))
      return
    }
    if (this.isLoading()) {
      return
    }
    fileInput.value = ''
    this.diskImage = null
    this.deviceIDERConnection.set(false)
    this.awaitingDiskSelection = true
    this.diskSelectionCanceled = false
    window.addEventListener('focus', this.onFilePickerClosed, { once: true })
    this.connect()
    fileInput.click()
  }

  onFileSelected(event: Event): void {
    this.awaitingDiskSelection = false
    const target = event.target as HTMLInputElement
    this.diskImage = target.files?.[0] ?? null
    this.deviceIDERConnection.set(this.diskImage !== null)

    if (this.diskImage === null) {
      this.diskSelectionCanceled = true
      this.isLoading.set(false)
      this.loadingStatus.set('')
      return
    }

    this.diskSelectionCanceled = false

    // Fallback in case file selection is triggered without going through Attach.
    if (!this.isLoading() && !this.isIDERActive()) {
      this.connect()
    }
  }

  private readonly onFilePickerClosed = (): void => {
    if (!this.awaitingDiskSelection) {
      return
    }

    this.awaitingDiskSelection = false
    if (this.diskImage === null) {
      this.diskSelectionCanceled = true
      this.isLoading.set(false)
      this.loadingStatus.set('')
    }
  }

  onCancelIDER(): void {
    // close the dialog, perform other actions as needed
    this.isLoading.set(false)
    this.loadingStatus.set('')
    this.deviceIDERConnection.set(false)
    this.isIDERActive.set(false)
    this.diskImage = null
    // Clear the file input so the same file can be selected again
    const fileInput = document.getElementById('file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
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
        return throwError(() => err)
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
      this.isLoading.set(false)
      this.loadingStatus.set('')
      this.isIDERActive.set(false)
      this.displayWarning(this.translate.instant('warning.iderEnded.value'))
    } else if (event === 3) {
      this.isLoading.set(false)
      this.loadingStatus.set('')
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
    window.removeEventListener('focus', this.onFilePickerClosed)
    this.isDisconnecting = true
  }
}
