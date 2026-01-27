/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
  input,
  effect
} from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, NavigationStart, Router } from '@angular/router'
import { defer, iif, interval, Observable, of, throwError } from 'rxjs'
import { catchError, mergeMap, switchMap, tap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import { environment } from 'src/environments/environment'
import {
  AMTFeaturesRequest,
  AMTFeaturesResponse,
  RedirectionStatus,
  UserConsentResponse,
  DisplaySelectionResponse
} from 'src/models/models'
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
import { TranslateModule, TranslateService } from '@ngx-translate/core'

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
    IDERComponent,
    TranslateModule
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
  private readonly translate = inject(TranslateService)

  public readonly deviceId = input('')

  public deviceKVMConnection = signal(false)

  public deviceIDERConnection = signal(false)

  public selectedEncoding = signal(1)

  public isFullscreen = signal(false)
  public isLoading = signal(false)
  public deviceState = signal(-1)
  public mpsServer = `${environment.mpsServer.replace('http', 'ws')}/relay`
  public readyToLoadKvm = false
  public authToken = signal('')
  public selectedHotkey: string | null = null
  public isIDERActive = signal(false)
  public amtFeatures = signal<AMTFeaturesResponse | null>(null)
  public diskImage: File | null = null
  public isDisconnecting = false
  private isEncodingChange = false
  public redirectionStatus: RedirectionStatus | null = null
  public hotKeySignal = signal<any>(null)
  public displays: { value: number; viewValue: string; disabled: boolean }[] = []
  public selectedDisplay = signal(0)

  // NEW: Track if initial data loading is complete
  private displayDataLoaded = false
  private initializationComplete = false
  private isInitializing = false

  private powerState: any = 0
  private timeInterval!: any

  public encodings = [
    { value: 1, viewValue: 'RLE 8' },
    { value: 2, viewValue: 'RLE 16' }
  ]

  public hotKeys = [
    { value: 'ctrl-alt-del', label: 'Ctrl + Alt + Del' },
    { value: 'alt-tab', label: 'Alt + Tab' },
    { value: 'alt-release', label: 'Alt [Release]' },
    { value: 'windows', label: 'Windows Key' },
    { value: 'windows-l', label: 'Windows Key + L' },
    { value: 'windows-r', label: 'Windows Key + R' },
    { value: 'windows-up', label: 'Windows Key + Up' },
    { value: 'windows-down', label: 'Windows Key + Down' },
    { value: 'windows-left', label: 'Windows Key + Left' },
    { value: 'windows-right', label: 'Windows Key + Right' },
    { value: 'alt-f4', label: 'Alt + F4' },
    { value: 'ctrl-w', label: 'Ctrl + W' }
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

    // Watch for deviceId changes and initialize when it becomes available
    effect(() => {
      const currentDeviceId = this.deviceId()
      if (currentDeviceId && !this.isInitializing && !this.initializationComplete) {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          if (!this.isInitializing && !this.initializationComplete) {
            this.ngOnInit()
          }
        }, 0)
      }
    })
  }

  ngOnInit(): void {
    console.log('KVMComponent: ngOnInit called, deviceId:', this.deviceId())

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.warn('KVMComponent: Already initializing, skipping duplicate ngOnInit')
      return
    }

    // Don't initialize if deviceId is empty - wait for it to be provided
    if (!this.deviceId()) {
      console.warn('KVMComponent: deviceId is empty, waiting for deviceId')
      return
    }

    this.devicesService
      .getRedirectionExpirationToken(this.deviceId())
      .pipe(
        tap((result) => {
          this.authToken.set(result.token)
        })
      )
      .subscribe()

    // we need to get power state every 15 seconds to keep the KVM/mouse from freezing
    this.timeInterval = interval(15000)
      .pipe(mergeMap(() => this.getPowerState(this.deviceId())))
      .subscribe()

    // Add keyboard event listeners in capture phase to intercept before KVM component
    // This is necessary because the KVM UI toolkit component also listens in capture phase
    document.addEventListener('keydown', this.handleKeyboardEventCapture, true)
    document.addEventListener('keyup', this.handleKeyboardEventCapture, true)
    document.addEventListener('keypress', this.handleKeyboardEventCapture, true)

    // Prevent duplicate initializations
    if (!this.isInitializing && !this.initializationComplete) {
      this.init()
    }
  }

  init(): void {
    console.log('KVMComponent: Initialization started')
    this.isInitializing = true
    this.isLoading.set(true)
    this.initializationComplete = false
    this.displayDataLoaded = false

    // First, load display selection data
    this.devicesService.getDisplaySelection(this.deviceId()).subscribe({
      next: (result: DisplaySelectionResponse) => {
        const displays = result?.displays ?? []
        this.displays = displays.map((d) => {
          const label = `Display ${d.displayIndex + 1}${d.resolutionX && d.resolutionY ? ` (${d.resolutionX} x ${d.resolutionY})` : ''}`
          return { value: d.displayIndex, viewValue: label, disabled: d.isActive === false }
        })
        // Set to default display if present, else first active display, else keep current
        const defaultDisplay = displays.find((d) => d.isDefault)
        if (defaultDisplay) {
          this.selectedDisplay.set(defaultDisplay.displayIndex)
        } else {
          const current = this.displays.find((x) => x.value === this.selectedDisplay())
          if (!current || current.disabled) {
            const firstActive = this.displays.find((x) => !x.disabled)
            if (firstActive) this.selectedDisplay.set(firstActive.value)
          }
        }
        this.displayDataLoaded = true
        // Only proceed with initialization after display data is loaded
        this.proceedWithInitialization()
      },
      error: (err) => {
        console.warn('Failed to load display selection:', err)
        // Fallback to default displays if API fails
        this.displays = [
          { value: 0, viewValue: 'Display 1', disabled: false },
          { value: 1, viewValue: 'Display 2', disabled: true },
          { value: 2, viewValue: 'Display 3', disabled: true },
          { value: 3, viewValue: 'Display 4', disabled: true }
        ]
        this.selectedDisplay.set(0)
        this.displayDataLoaded = true
        this.proceedWithInitialization()
      }
    })
  }

  // NEW: Only proceed with initialization chain after display data is loaded
  private proceedWithInitialization(): void {
    if (!this.displayDataLoaded) {
      console.log('KVMComponent: Waiting for display data to load...')
      return
    }

    console.log('KVMComponent: Display data loaded, proceeding with device initialization')

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
        this.initializationComplete = true
        this.isInitializing = false
        console.log('KVMComponent: Initialization complete')
      })
  }

  postUserConsentDecision(result: boolean): Observable<any> {
    if (result !== false) {
      // If result is true OR null (no consent needed), make KVM ready
      this.readyToLoadKvm = this.amtFeatures()?.kvmAvailable ?? false
      // Check if user clicked Connect while we were initializing
      if (this.deviceState() === -1) {
        console.log('KVMComponent: Ready to load KVM - user already clicked Connect, connecting now')
        this.deviceKVMConnection.set(true)
        this.deviceState.set(2) // Mark as connected
      } else {
        console.log('KVMComponent: Ready to load KVM - waiting for manual Connect button click')
        this.deviceKVMConnection.set(false)
      }
      this.getAMTFeatures()
    } else {
      this.isLoading.set(false)
      this.deviceState.set(0)
    }
    return of(null)
  }

  private handleKeyboardEventCapture = (event: KeyboardEvent): void => {
    // Only intercept keyboard events when KVM is connected
    if (this.deviceKVMConnection()) {
      const activeElement = document.activeElement as HTMLElement
      const tagName = activeElement?.tagName.toLowerCase()

      // Check if the active element is an input field, textarea, select, or has contenteditable
      const isInputElement =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        activeElement?.isContentEditable ||
        activeElement?.closest('mat-select') !== null ||
        activeElement?.closest('mat-form-field') !== null ||
        activeElement?.closest('.mat-select-panel') !== null

      // If an input element has focus, stop the event immediately to prevent KVM from capturing it
      if (isInputElement) {
        event.stopImmediatePropagation()
      }
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  @HostListener('document:mozfullscreenchange')
  @HostListener('document:MSFullscreenChange')
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
    console.log('KVMComponent: Manual connect clicked')
    this.isDisconnecting = false
    // If ready to connect, do it immediately
    if (this.readyToLoadKvm && this.initializationComplete) {
      console.log('KVMComponent: Ready - connecting to KVM now')
      this.deviceKVMConnection.set(true)
    } else if (this.isInitializing) {
      // Initialization in progress, set flag to connect when done
      console.log('KVMComponent: Initialization in progress, will connect when ready')
      this.deviceState.set(-1) // Signal that user wants to connect
    } else {
      // Not initialized yet, start initialization
      console.log('KVMComponent: Not initialized, starting initialization then will connect')
      this.deviceState.set(-1) // Signal that user wants to connect
      this.init()
    }
  }
  @HostListener('window:beforeunload')
  beforeUnloadHandler() {
    this.disconnect()
  }

  disconnect(): void {
    console.log('KVMComponent: Disconnect called')
    this.isDisconnecting = true
    this.deviceKVMConnection.set(false)
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement
    this.diskImage = target.files?.[0] ?? null
    this.deviceIDERConnection.set(true)
  }

  onCancelIDER(): void {
    // close the dialog, perform other actions as needed
    this.deviceIDERConnection.set(false)
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
        const msg: string = this.translate.instant('kvm.errorRetrieve.value')
        this.displayError(msg)
        return throwError(err)
      })
    )
  }

  handleRedirectionStatus(redirectionStatus: RedirectionStatus): Observable<any> {
    this.redirectionStatus = redirectionStatus
    if (this.amtFeatures()?.kvmAvailable && this.redirectionStatus.isKVMConnected) {
      const msg: string = this.translate.instant('kvm.errorRetrieve.value')
      this.displayError(msg)
      return of(null)
    }
    return of(true)
  }

  getPowerState(guid: string): Observable<any> {
    return this.devicesService.getPowerState(guid).pipe(
      catchError((err) => {
        this.isLoading.set(false)
        const msg: string = this.translate.instant('kvm.errorRetrieve.value')
        this.displayError(msg)
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
        const msg: string = this.translate.instant('kvm.errorRetrieve.value')
        this.displayError(msg)
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
      const msg: string = this.translate.instant('kvm.errorRetrieve.value')
      this.displayError(msg)
    } else {
      const msg: string = this.translate.instant('kvm.errorRetrieve.value')
      this.displayError(msg)
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
    // Set flag to prevent error message during encoding change
    this.isEncodingChange = true

    // Simply update the encoding - let the UI toolkit component handle the reconnection
    this.selectedEncoding.set(e)

    // Clear the flag after the encoding change process completes
    // This should be longer than the UI toolkit's reconnection process
    setTimeout(() => {
      this.isEncodingChange = false
    }, 6000) // 6 seconds to account for 1s + 4s init delay
  }

  deviceKVMStatus = (event: any): void => {
    this.deviceState.set(event)
    if (event === 2) {
      this.isLoading.set(false)
    } else if (event === 0) {
      this.isLoading.set(false)
      if (!this.isDisconnecting && !this.isEncodingChange) {
        this.displayError(this.translate.instant('errors.kvmConnection.value'))
      }
      this.isDisconnecting = false
    }

    this.devicesService.deviceState.emit(this.deviceState())
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

  displayError(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }

  displayWarning(message: string): void {
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultWarn)
  }

  ngOnDestroy(): void {
    console.log('KVMComponent: ngOnDestroy called')
    this.isDisconnecting = true
    this.isInitializing = false
    if (this.timeInterval) {
      this.timeInterval.unsubscribe()
    }
    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.handleKeyboardEventCapture, true)
    document.removeEventListener('keyup', this.handleKeyboardEventCapture, true)
    document.removeEventListener('keypress', this.handleKeyboardEventCapture, true)
  }
}
