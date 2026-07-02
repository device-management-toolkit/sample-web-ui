/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnDestroy, OnInit, inject, signal, input, computed, WritableSignal } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { DevicesService } from '../devices.service'
import { MatCardModule } from '@angular/material/card'
import { catchError, concatMap, finalize, forkJoin, map, of, Subject, takeUntil, throwError } from 'rxjs'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatListModule } from '@angular/material/list'
import { MatIcon } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatTabsModule } from '@angular/material/tabs'
import {
  NetworkConfig,
  WiredNetworkConfigRequest,
  WirelessState,
  DeviceWirelessProfileRequest,
  DeviceWirelessProfileResponse,
  DeviceWirelessIEEE8021x,
  WirelessProfileSyncRequest
} from '../../../models/models'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatButtonModule } from '@angular/material/button'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatRadioModule } from '@angular/material/radio'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatTooltipModule } from '@angular/material/tooltip'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'

@Component({
  selector: 'app-network-settings',
  imports: [
    MatCardModule,
    MatListModule,
    MatIcon,
    MatProgressBarModule,
    TranslatePipe,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './network-settings.component.html',
  styleUrl: './network-settings.component.scss'
})
export class NetworkSettingsComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  private readonly fb = inject(FormBuilder)
  private readonly dialog = inject(MatDialog)
  public readonly deviceId = input('')
  private readonly destroy$ = new Subject<void>()

  public isWiredLoading = signal(true)
  public isWirelessLoading = signal(true)
  public isWirelessConfigLoading = signal(true)
  public selectedTabIndex = signal(0)
  public isSavingWired = signal(false)
  public isSavingWireless = signal(false)
  public isSavingWirelessProfile = signal(false)
  public isLoadingWirelessProfiles = signal(false)
  public isRefreshingNetwork = signal(false)
  public uefiProfileSyncSupported = signal(true)
  public wiredIeee8021xExpanded = signal(false)
  public networkResults = signal<NetworkConfig | undefined>(undefined)
  public wirelessProfiles = signal<DeviceWirelessProfileResponse[]>([])
  public readonly maxWirelessProfiles = 8
  public readonly isWirelessProfileLimitReached = computed(
    () => this.wirelessProfiles().length >= this.maxWirelessProfiles
  )
  public editingWirelessProfileName = signal<string | null>(null)
  public showWirelessProfileForm = signal(false)
  public showWiredConfigForm = signal(false)
  public showWirelessConfigForm = signal(false)
  public clientCertFileName = signal('')
  public privateKeyFileName = signal('')
  public caCertFileName = signal('')
  public readonly wirelessAuthMethodOptions = [
    'WPAPSK',
    'WPA2PSK',
    'WPAIEEE8021x',
    'WPA2IEEE8021x'
  ]

  public readonly wirelessEncryptionMethodOptions = [
    'TKIP',
    'CCMP'
  ]

  public readonly wirelessIEEE8021xProtocolOptions = [
    { value: 0, label: 'EAP-TLS' },
    { value: 2, label: 'PEAP-MSCHAPv2' }
  ]

  public readonly ieee8021xProtocolTLS = 0
  public readonly ieee8021xProtocolPEAP = 2

  public readonly wiredForm = this.fb.nonNullable.group({
    dhcpEnabled: true,
    ipSyncEnabled: true,
    ipAddress: '',
    subnetMask: '',
    defaultGateway: '',
    primaryDNS: '',
    secondaryDNS: ''
  })

  public readonly wirelessSettingsForm = this.fb.nonNullable.group({
    enabled: true,
    localProfileSyncEnabled: false,
    uefiProfileSyncEnabled: false
  })

  public readonly wirelessProfileForm = this.fb.nonNullable.group({
    profileName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]],
    ssid: ['', Validators.required],
    priority: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(255),
        this.priorityConflictValidator()
      ]
    ],
    authenticationMethod: ['WPA2PSK', Validators.required],
    encryptionMethod: ['CCMP', Validators.required],
    password: [''],
    ieee8021xUsername: [''],
    ieee8021xAuthenticationProtocol: [0],
    ieee8021xPassword: [''],
    ieee8021xClientCert: [''],
    ieee8021xPrivateKey: [''],
    ieee8021xCACert: ['']
  })

  ngOnInit(): void {
    this.setupWiredFormBehavior()

    this.devicesService
      .getNetworkSettings(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('network.errorNetworkSetting.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          this.isWirelessConfigLoading.set(false)
          return throwError(() => err)
        }),
        finalize(() => {
          this.isWiredLoading.set(false)
          this.isWirelessLoading.set(false)
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((results) => {
        this.networkResults.set(results)
        this.patchWiredForm(results)
        if (results?.wired == null && results?.wireless != null) {
          this.selectedTabIndex.set(1)
        }
        if (results?.wireless != null) {
          this.loadWirelessCardData()
        } else {
          this.isWirelessConfigLoading.set(false)
        }
      })

    this.wirelessProfileForm.controls.authenticationMethod.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateWirelessProfileValidators()
    })
    this.wirelessProfileForm.controls.ieee8021xAuthenticationProtocol.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateWirelessProfileValidators()
      })
    this.updateWirelessProfileValidators()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  public hasWiredAdapter(): boolean {
    return this.isWiredLoading() || this.networkResults()?.wired != null
  }

  public hasWirelessAdapter(): boolean {
    return this.isWirelessLoading() || this.networkResults()?.wireless != null
  }

  public isWiredIeee8021xEnabled(): boolean {
    const enabled = this.networkResults()?.wired?.ieee8021x?.enabled
    return enabled != null && enabled !== '' && enabled !== 'Disabled'
  }

  public toggleWiredIeee8021x(): void {
    this.wiredIeee8021xExpanded.update((expanded) => !expanded)
  }

  public toggleWiredConfigForm(): void {
    this.showWiredConfigForm.update((shown) => !shown)
  }

  public toggleWirelessConfigForm(): void {
    this.showWirelessConfigForm.update((shown) => !shown)
  }

  public saveWiredSettings(): void {
    if (this.wiredForm.invalid) {
      this.wiredForm.markAllAsTouched()
      return
    }

    const raw = this.wiredForm.getRawValue()
    const payload: WiredNetworkConfigRequest = {
      dhcpEnabled: raw.dhcpEnabled,
      ipSyncEnabled: raw.ipSyncEnabled
    }

    if (!raw.dhcpEnabled && !raw.ipSyncEnabled) {
      payload.ipAddress = raw.ipAddress
      payload.subnetMask = raw.subnetMask
      payload.defaultGateway = raw.defaultGateway
      payload.primaryDNS = raw.primaryDNS
      payload.secondaryDNS = raw.secondaryDNS
    }

    this.isSavingWired.set(true)
    this.devicesService
      .patchWiredNetworkSettings(this.deviceId(), payload)
      .pipe(
        catchError((err) => {
          this.showError(this.translate.instant('network.wired.updateError.value'), err)
          return throwError(() => err)
        }),
        finalize(() => {
          this.isSavingWired.set(false)
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.snackBar.open(
          this.translate.instant('network.wired.updateSuccess.value'),
          undefined,
          SnackbarDefaults.defaultSuccess
        )
        this.wiredForm.markAsPristine()
        this.refreshNetworkSettings()
      })
  }

  public saveWirelessSettings(): void {
    const raw = this.wirelessSettingsForm.getRawValue()
    const statePayload = {
      state: raw.enabled ? ('WifiEnabledS0SxAC' as WirelessState) : ('WifiDisabled' as WirelessState)
    }
    const syncPayload: WirelessProfileSyncRequest = {
      localProfileSync: raw.localProfileSyncEnabled,
      uefiProfileSync: raw.uefiProfileSyncEnabled
    }
    this.isSavingWireless.set(true)
    this.wirelessSettingsForm.disable({ emitEvent: false })

    // Apply the wireless state change first, then the profile sync settings sequentially. The local
    // and UEFI sync settings live on the same WiFiPortConfigurationService object and each backend
    // call performs a read-modify-write, so they must run in order to avoid clobbering each other.
    this.devicesService
      .requestWirelessStateChange(this.deviceId(), statePayload)
      .pipe(
        concatMap((state) =>
          this.devicesService
            .setWirelessProfileSync(this.deviceId(), syncPayload)
            .pipe(map((sync) => ({ state, sync })))
        ),
        catchError((err) => {
          this.showError(this.translate.instant('network.wireless.updateError.value'), err)
          this.loadWirelessConfiguration()
          return throwError(() => err)
        }),
        finalize(() => {
          this.isSavingWireless.set(false)
          this.wirelessSettingsForm.enable({ emitEvent: false })
          this.applyUefiProfileSyncSupport(this.uefiProfileSyncSupported())
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((rsp) => {
        this.wirelessSettingsForm.patchValue({
          enabled: rsp.state.state !== 'WifiDisabled',
          localProfileSyncEnabled: rsp.sync.localProfileSync,
          uefiProfileSyncEnabled: rsp.sync.uefiProfileSync
        })
        this.uefiProfileSyncSupported.set(rsp.sync.uefiProfileSyncSupported)
        this.wirelessSettingsForm.markAsPristine()
        this.snackBar.open(
          this.translate.instant('network.wireless.updateSuccess.value'),
          undefined,
          SnackbarDefaults.defaultSuccess
        )
        this.refreshNetworkSettings()
      })
  }

  public saveWirelessProfile(): void {
    if (this.wirelessProfileForm.invalid) {
      this.wirelessProfileForm.markAllAsTouched()
      return
    }

    const raw = this.wirelessProfileForm.getRawValue()
    const payload: DeviceWirelessProfileRequest = {
      profileName: raw.profileName,
      ssid: raw.ssid,
      priority: Number(raw.priority),
      authenticationMethod: raw.authenticationMethod,
      encryptionMethod: raw.encryptionMethod
    }

    if (this.requiresPskPassword(raw.authenticationMethod)) {
      payload.password = raw.password
    } else {
      const ieee8021x: DeviceWirelessIEEE8021x = {
        username: raw.ieee8021xUsername,
        authenticationProtocol: raw.ieee8021xAuthenticationProtocol
      }

      if (raw.ieee8021xAuthenticationProtocol === this.ieee8021xProtocolPEAP) {
        ieee8021x.password = raw.ieee8021xPassword
      }

      if (raw.ieee8021xAuthenticationProtocol === this.ieee8021xProtocolTLS) {
        ieee8021x.clientCert = raw.ieee8021xClientCert
        ieee8021x.privateKey = raw.ieee8021xPrivateKey
      }

      if (raw.ieee8021xCACert !== '') {
        ieee8021x.caCert = raw.ieee8021xCACert
      }

      payload.ieee8021x = ieee8021x
    }

    this.isSavingWirelessProfile.set(true)
    const request =
      this.editingWirelessProfileName() == null
        ? this.devicesService.addWirelessProfile(this.deviceId(), payload)
        : this.devicesService.updateWirelessProfile(this.deviceId(), payload)

    request
      .pipe(
        catchError((err) => {
          this.showError(this.translate.instant('network.wirelessProfile.saveError.value'), err)
          return throwError(() => err)
        }),
        finalize(() => {
          this.isSavingWirelessProfile.set(false)
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.snackBar.open(
          this.translate.instant('network.wirelessProfile.saveSuccess.value'),
          undefined,
          SnackbarDefaults.defaultSuccess
        )
        this.resetWirelessProfileForm()
        this.loadWirelessProfiles()
      })
  }

  public addNewWirelessProfile(): void {
    this.resetWirelessProfileForm()
    this.showWirelessProfileForm.set(true)
  }

  public editWirelessProfile(profile: DeviceWirelessProfileResponse): void {
    this.editingWirelessProfileName.set(profile.profileName)
    this.showWirelessProfileForm.set(true)
    this.clientCertFileName.set('')
    this.privateKeyFileName.set('')
    this.caCertFileName.set('')
    this.wirelessProfileForm.controls.profileName.disable({ emitEvent: false })
    this.wirelessProfileForm.patchValue(
      {
        profileName: profile.profileName,
        ssid: profile.ssid,
        priority: profile.priority,
        authenticationMethod: profile.authenticationMethod,
        encryptionMethod: profile.encryptionMethod,
        password: '',
        ieee8021xUsername: profile.ieee8021x?.username ?? '',
        ieee8021xAuthenticationProtocol: profile.ieee8021x?.authenticationProtocol ?? 0,
        ieee8021xPassword: '',
        ieee8021xClientCert: '',
        ieee8021xPrivateKey: '',
        ieee8021xCACert: ''
      },
      { emitEvent: false }
    )
    this.wirelessProfileForm.controls.priority.updateValueAndValidity({ emitEvent: false })
    this.updateWirelessProfileValidators()
  }

  public resetWirelessProfileForm(): void {
    this.editingWirelessProfileName.set(null)
    this.showWirelessProfileForm.set(false)
    this.clientCertFileName.set('')
    this.privateKeyFileName.set('')
    this.caCertFileName.set('')
    this.wirelessProfileForm.controls.profileName.enable({ emitEvent: false })
    this.wirelessProfileForm.reset({
      profileName: '',
      ssid: '',
      priority: null,
      authenticationMethod: 'WPA2PSK',
      encryptionMethod: 'CCMP',
      password: '',
      ieee8021xUsername: '',
      ieee8021xAuthenticationProtocol: 0,
      ieee8021xPassword: '',
      ieee8021xClientCert: '',
      ieee8021xPrivateKey: '',
      ieee8021xCACert: ''
    })
    this.updateWirelessProfileValidators()
  }

  public deleteWirelessProfile(profileName: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed !== true) {
          return
        }

        this.isSavingWirelessProfile.set(true)
        this.devicesService
          .deleteWirelessProfile(this.deviceId(), profileName)
          .pipe(
            catchError((err) => {
              this.showError(this.translate.instant('network.wirelessProfile.deleteError.value'), err)
              return throwError(() => err)
            }),
            finalize(() => {
              this.isSavingWirelessProfile.set(false)
            }),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            this.snackBar.open(
              this.translate.instant('network.wirelessProfile.deleteSuccess.value'),
              undefined,
              SnackbarDefaults.defaultSuccess
            )
            if (this.editingWirelessProfileName() === profileName) {
              this.resetWirelessProfileForm()
            }
            this.loadWirelessProfiles()
          })
      })
  }

  private refreshNetworkSettings(): void {
    this.isRefreshingNetwork.set(true)
    this.devicesService
      .getNetworkSettings(this.deviceId())
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.isRefreshingNetwork.set(false)
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        if (results == null) {
          return
        }
        this.networkResults.set(results)
        this.patchWiredForm(results)
      })
  }

  private patchWiredForm(results: NetworkConfig): void {
    const wired = results?.wired
    if (wired == null) {
      return
    }

    this.wiredForm.patchValue(
      {
        dhcpEnabled: wired.dhcpEnabled,
        ipSyncEnabled: wired.dhcpEnabled ? true : wired.ipSyncEnabled,
        ipAddress: wired.ipAddress ?? '',
        subnetMask: wired.subnetMask ?? '',
        defaultGateway: wired.defaultGateway ?? '',
        primaryDNS: wired.primaryDNS ?? '',
        secondaryDNS: wired.secondaryDNS ?? ''
      },
      { emitEvent: false }
    )

    if (wired.dhcpEnabled) {
      this.wiredForm.controls.ipSyncEnabled.disable({ emitEvent: false })
    } else {
      this.wiredForm.controls.ipSyncEnabled.enable({ emitEvent: false })
    }

    this.updateWiredStaticValidators()
  }

  private loadWirelessCardData(): void {
    this.isWirelessConfigLoading.set(true)
    forkJoin({
      state: this.devicesService.getWirelessState(this.deviceId()).pipe(catchError(() => of(null))),
      profileSync: this.devicesService.getWirelessProfileSync(this.deviceId()).pipe(catchError(() => of(null))),
      profiles: this.devicesService
        .getWirelessProfiles(this.deviceId())
        .pipe(catchError(() => of([] as DeviceWirelessProfileResponse[])))
    })
      .pipe(
        finalize(() => {
          this.isWirelessConfigLoading.set(false)
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((rsp) => {
        this.wirelessSettingsForm.patchValue({
          enabled:
            rsp.state != null ? rsp.state.state !== 'WifiDisabled' : this.wirelessSettingsForm.controls.enabled.value,
          localProfileSyncEnabled:
            rsp.profileSync?.localProfileSync ?? this.wirelessSettingsForm.controls.localProfileSyncEnabled.value,
          uefiProfileSyncEnabled:
            rsp.profileSync?.uefiProfileSync ?? this.wirelessSettingsForm.controls.uefiProfileSyncEnabled.value
        })
        this.applyUefiProfileSyncSupport(rsp.profileSync?.uefiProfileSyncSupported ?? true)
        this.wirelessProfiles.set(this.sortProfilesByPriority(rsp.profiles))
        this.wirelessProfileForm.controls.priority.updateValueAndValidity({ emitEvent: false })
      })
  }

  private loadWirelessConfiguration(): void {
    forkJoin({
      state: this.devicesService.getWirelessState(this.deviceId()).pipe(catchError(() => of(null))),
      profileSync: this.devicesService.getWirelessProfileSync(this.deviceId()).pipe(catchError(() => of(null)))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe((rsp) => {
        this.wirelessSettingsForm.patchValue({
          enabled:
            rsp.state != null ? rsp.state.state !== 'WifiDisabled' : this.wirelessSettingsForm.controls.enabled.value,
          localProfileSyncEnabled:
            rsp.profileSync?.localProfileSync ?? this.wirelessSettingsForm.controls.localProfileSyncEnabled.value,
          uefiProfileSyncEnabled:
            rsp.profileSync?.uefiProfileSync ?? this.wirelessSettingsForm.controls.uefiProfileSyncEnabled.value
        })
        this.applyUefiProfileSyncSupport(rsp.profileSync?.uefiProfileSyncSupported ?? true)
      })
  }

  // The UEFI/CSME Wi-Fi profile sharing setting is only available on devices whose
  // firmware reports support for it. When unsupported, force the toggle off and disable
  // it so the user cannot submit a change the backend would reject.
  private applyUefiProfileSyncSupport(supported: boolean): void {
    this.uefiProfileSyncSupported.set(supported)
    const control = this.wirelessSettingsForm.controls.uefiProfileSyncEnabled
    if (supported) {
      control.enable({ emitEvent: false })
    } else {
      control.setValue(false, { emitEvent: false })
      control.disable({ emitEvent: false })
    }
  }

  private loadWirelessProfiles(): void {
    this.isLoadingWirelessProfiles.set(true)
    this.devicesService
      .getWirelessProfiles(this.deviceId())
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.isLoadingWirelessProfiles.set(false)
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((profiles) => {
        this.wirelessProfiles.set(this.sortProfilesByPriority(profiles))
        this.wirelessProfileForm.controls.priority.updateValueAndValidity({ emitEvent: false })
      })
  }

  private sortProfilesByPriority(profiles: DeviceWirelessProfileResponse[]): DeviceWirelessProfileResponse[] {
    return [...profiles].sort((a, b) => a.priority - b.priority)
  }

  // Prevents non-numeric characters (e, E, +, -, .) that the native number
  // input would otherwise accept while typing into the priority field.
  public blockNonNumericKey(event: KeyboardEvent): void {
    if ([
        'e',
        'E',
        '+',
        '-',
        '.'
      ].includes(event.key)) {
      event.preventDefault()
    }
  }

  // Rejects a priority that is already used by another wireless profile on the
  // device. The profile currently being edited is excluded so re-saving it with
  // its own priority does not flag a conflict.
  private priorityConflictValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value
      if (value == null || value === '') {
        return null
      }

      const editingName = this.editingWirelessProfileName()
      const hasConflict = this.wirelessProfiles().some(
        (profile) => profile.priority === Number(value) && profile.profileName !== editingName
      )

      return hasConflict ? { priorityConflict: true } : null
    }
  }

  private setupWiredFormBehavior(): void {
    this.wiredForm.controls.dhcpEnabled.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isDhcpEnabled) => {
      if (isDhcpEnabled) {
        this.wiredForm.controls.ipSyncEnabled.patchValue(true, { emitEvent: false })
        this.wiredForm.controls.ipSyncEnabled.disable({ emitEvent: false })
      } else {
        this.wiredForm.controls.ipSyncEnabled.enable({ emitEvent: false })
      }

      this.updateWiredStaticValidators()
    })

    this.wiredForm.controls.ipSyncEnabled.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateWiredStaticValidators()
    })

    if (this.wiredForm.controls.dhcpEnabled.value) {
      this.wiredForm.controls.ipSyncEnabled.disable({ emitEvent: false })
    }
  }

  private updateWiredStaticValidators(): void {
    const requiresStaticValues =
      !this.wiredForm.controls.dhcpEnabled.value && !this.wiredForm.controls.ipSyncEnabled.value
    const controls = [
      this.wiredForm.controls.ipAddress,
      this.wiredForm.controls.subnetMask,
      this.wiredForm.controls.defaultGateway,
      this.wiredForm.controls.primaryDNS
    ]

    controls.forEach((control) => {
      if (requiresStaticValues) {
        control.setValidators([Validators.required])
      } else {
        control.clearValidators()
      }
      control.updateValueAndValidity({ emitEvent: false })
    })
  }

  private updateWirelessProfileValidators(): void {
    const authMethod = this.wirelessProfileForm.controls.authenticationMethod.value
    const isPSK = this.requiresPskPassword(authMethod)
    const protocol = this.wirelessProfileForm.controls.ieee8021xAuthenticationProtocol.value
    const controls = this.wirelessProfileForm.controls

    if (isPSK) {
      controls.password.setValidators([Validators.required, Validators.minLength(8)])
      controls.ieee8021xUsername.clearValidators()
      controls.ieee8021xPassword.clearValidators()
      controls.ieee8021xClientCert.clearValidators()
      controls.ieee8021xPrivateKey.clearValidators()
      controls.ieee8021xPassword.disable({ emitEvent: false })
    } else {
      controls.password.clearValidators()
      controls.ieee8021xUsername.setValidators([Validators.required])

      if (protocol === this.ieee8021xProtocolPEAP) {
        controls.ieee8021xPassword.setValidators([Validators.required])
        controls.ieee8021xPassword.enable({ emitEvent: false })
        controls.ieee8021xClientCert.clearValidators()
        controls.ieee8021xPrivateKey.clearValidators()
      } else {
        controls.ieee8021xPassword.clearValidators()
        controls.ieee8021xPassword.disable({ emitEvent: false })
        controls.ieee8021xClientCert.setValidators([Validators.required])
        controls.ieee8021xPrivateKey.setValidators([Validators.required])
      }
    }

    controls.password.updateValueAndValidity({ emitEvent: false })
    controls.ieee8021xUsername.updateValueAndValidity({ emitEvent: false })
    controls.ieee8021xPassword.updateValueAndValidity({ emitEvent: false })
    controls.ieee8021xClientCert.updateValueAndValidity({ emitEvent: false })
    controls.ieee8021xPrivateKey.updateValueAndValidity({ emitEvent: false })
  }

  private requiresPskPassword(authenticationMethod: string): boolean {
    return authenticationMethod === 'WPAPSK' || authenticationMethod === 'WPA2PSK'
  }

  public onClientCertSelected(event: Event): void {
    this.readCredentialFile(event, 'ieee8021xClientCert', this.clientCertFileName)
  }

  public onPrivateKeySelected(event: Event): void {
    this.readCredentialFile(event, 'ieee8021xPrivateKey', this.privateKeyFileName)
  }

  public onCACertSelected(event: Event): void {
    this.readCredentialFile(event, 'ieee8021xCACert', this.caCertFileName)
  }

  // Reads a certificate or key file and stores its base64 DER body (PEM armor and
  // whitespace stripped) in the given form control, matching the format the backend
  // expects when adding credentials to the device.
  private readCredentialFile(
    event: Event,
    controlName: 'ieee8021xClientCert' | 'ieee8021xPrivateKey' | 'ieee8021xCACert',
    fileNameSignal: WritableSignal<string>
  ): void {
    if (typeof FileReader === 'undefined') {
      return
    }

    const target = event.target as HTMLInputElement | null
    const files = target?.files
    if (files == null || files.length === 0) {
      return
    }

    const file = files[0]
    const isPem = /\.(pem|key|crt|cer)$/i.test(file.name)
    const reader = new FileReader()

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string
      let credential: string
      if (isPem) {
        credential = result.replace(/-----(BEGIN|END)[^-]+-----/g, '').replace(/\s+/g, '')
      } else {
        const index = result.indexOf('base64,')
        credential = index >= 0 ? result.substring(index + 7) : result
      }

      this.wirelessProfileForm.controls[controlName].setValue(credential)
      this.wirelessProfileForm.controls[controlName].markAsDirty()
      fileNameSignal.set(file.name)
    }

    if (isPem) {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }

    // Allow re-selecting the same file by clearing the native input value.
    if (target != null) {
      target.value = ''
    }
  }

  private showError(message: string, err?: unknown): void {
    // The global error-handling interceptor already surfaces a dialog for stale-write
    // conflicts (409/412). Suppress the local snackbar for those so the user does not
    // see two competing messages for the same failure.
    if (err instanceof HttpErrorResponse && (err.status === 409 || err.status === 412)) {
      return
    }
    this.snackBar.open(message, undefined, SnackbarDefaults.defaultError)
  }
}
