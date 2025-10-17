/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, computed } from '@angular/core'
import { FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize, map, startWith } from 'rxjs/operators'
import { forkJoin, Observable } from 'rxjs'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop'
import { NgClass, AsyncPipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

// Material UI imports
import { MatToolbar } from '@angular/material/toolbar'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card'
import { MatList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list'
import { MatFormField, MatLabel, MatError, MatHint, MatSuffix } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { MatOption } from '@angular/material/core'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatDivider } from '@angular/material/divider'
import { MatIconButton, MatButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio'
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete'
import { MatChipInputEvent, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput } from '@angular/material/chips'

// Services
import { ConfigsService } from 'src/app/configs/configs.service'
import { ProfilesService } from '../profiles.service'
import { WirelessService } from 'src/app/wireless/wireless.service'
import { IEEE8021xService } from '../../ieee8021x/ieee8021x.service'
import { ProxyConfigsService } from 'src/app/proxy-configs/proxy-configs.service'

// Shared components
import { RandomPassAlertComponent } from 'src/app/shared/random-pass-alert/random-pass-alert.component'
import { StaticCIRAWarningComponent } from 'src/app/shared/static-cira-warning/static-cira-warning.component'

// Models and constants
import { CIRAConfig, IEEE8021xConfig } from 'src/models/models'
import {
  ActivationModes,
  Profile,
  proxyConfig,
  TlsModes,
  TlsSigningAuthorities,
  UserConsentModes,
  WiFiConfig
} from '../profiles.constants'
import { environment } from 'src/environments/environment'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'

const NO_WIFI_CONFIGS = 'profileDetail.noWifi.value'
const NO_PROXY_CONFIGS = 'profileDetail.noProxy.value'

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
  imports: [
    MatToolbar,
    MatProgressBar,
    MatCard,
    MatList,
    MatListItem,
    MatIcon,
    MatListItemIcon,
    MatListItemTitle,
    ReactiveFormsModule,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatHint,
    MatSelect,
    MatOption,
    MatCheckbox,
    MatDivider,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatRadioGroup,
    MatRadioButton,
    MatAutocompleteTrigger,
    MatAutocomplete,
    NgClass,
    CdkDropList,
    CdkDrag,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatChipInput,
    MatCardActions,
    MatButton,
    AsyncPipe,
    TranslateModule
  ]
})
export class ProfileDetailComponent implements OnInit {
  // Constants
  private readonly CONNECTION_MODE = {
    cira: 'CIRA',
    tls: 'TLS',
    direct: 'DIRECT'
  } as const

  private readonly SEPARATOR_KEYS = [ENTER, COMMA] as const

  private readonly PASSWORD_REQUIREMENTS = [
    /[a-z]/,
    /[A-Z]/,
    /[0-9]/,
    /[!$%]/
  ] as const

  // Dependency injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly fb = inject(FormBuilder)
  private readonly activeRoute = inject(ActivatedRoute)
  private readonly profilesService = inject(ProfilesService)
  private readonly configsService = inject(ConfigsService)
  private readonly wirelessService = inject(WirelessService)
  private readonly ieee8021xService = inject(IEEE8021xService)
  private readonly proxyConfigsService = inject(ProxyConfigsService)
  private readonly dialog = inject(MatDialog)
  private readonly translate = inject(TranslateService)
  public readonly router = inject(Router)
  NO_WIFI_CONFIGS = this.translate.instant(NO_WIFI_CONFIGS)
  NO_PROXY_CONFIGS = this.translate.instant(NO_PROXY_CONFIGS)
  // Computed properties and signals
  public readonly cloudMode = environment.cloud
  public readonly isLoading = signal(false)
  public readonly errorMessages = signal<string[]>([])

  // Form setup
  public readonly profileForm = this.createProfileForm()
  public readonly wirelessAutocomplete = new FormControl('')
  public readonly proxyAutocomplete = new FormControl('')

  // Observable streams
  public readonly filteredWirelessList = this.setupWirelessFilter()
  public readonly filteredProxyList = this.setupProxyFilter()

  // State signals
  public readonly isEdit = signal(false)
  public readonly pageTitle = signal('profiles.header.profileNewTitle.value')
  public readonly tags = signal<string[]>([])
  public readonly selectedWifiConfigs = signal<WiFiConfig[]>([])
  public readonly selectedProxyConfigs = signal<proxyConfig[]>([])
  public readonly ciraConfigurations = signal<CIRAConfig[]>([])
  public readonly iee8021xConfigurations = signal<IEEE8021xConfig[]>([])
  public readonly wirelessConfigurations = signal<string[]>([])
  public readonly ProxyConfigurations = signal<string[]>([])
  public readonly amtInputType = signal<'password' | 'text'>('password')
  public readonly mebxInputType = signal<'password' | 'text'>('password')

  // Computed properties
  public readonly showIEEE8021xConfigurations = computed(() => this.iee8021xConfigurations().length > 0)
  public readonly showWirelessConfigurations = computed(() => this.wirelessConfigurations().length > 0)
  public readonly showProxyConfigurations = computed(() => this.ProxyConfigurations().length > 0)

  // Constants for template use
  public readonly activationModes = ActivationModes
  public readonly userConsentModes = UserConsentModes
  public readonly tlsModes = TlsModes
  public readonly tlsSigningAuthorities = TlsSigningAuthorities
  public readonly tlsDefaultSigningAuthority = 'SelfSigned'
  public readonly separatorKeysCodes = this.SEPARATOR_KEYS
  public readonly tooltipIpSyncEnabled = 'Only applicable for static wired network config'
  public readonly connectionMode = this.CONNECTION_MODE

  public readonly matDialogConfig: MatDialogConfig = {
    height: '275px',
    width: '450px'
  }

  ngOnInit(): void {
    this.initializeData()
    this.setupFormSubscriptions()
    this.handleRouteParams()
  }

  private initializeData(): void {
    this.getIEEE8021xConfigs()
    this.getWirelessConfigs()
    this.getProxyConfigs()
    this.getCiraConfigs()
  }

  private setupFormSubscriptions(): void {
    this.profileForm.controls.activation.valueChanges.subscribe((value) => {
      if (value) this.activationChange(value)
    })

    this.profileForm.controls.generateRandomPassword.valueChanges.subscribe((value) => {
      if (value !== null) this.generateRandomPasswordChange(value)
    })

    this.profileForm.controls.generateRandomMEBxPassword.valueChanges.subscribe((value) => {
      if (value !== null) this.generateRandomMEBxPasswordChange(value)
    })

    this.profileForm.controls.dhcpEnabled.valueChanges.subscribe((value) => {
      if (value !== null) this.dhcpEnabledChange(value)
    })

    this.profileForm.controls.connectionMode.valueChanges.subscribe((value) => {
      if (value) this.connectionModeChange(value)
    })
  }

  private handleRouteParams(): void {
    this.activeRoute.params.subscribe((params) => {
      if (params.name) {
        this.isLoading.set(true)
        this.isEdit.set(true)
        this.profileForm.controls.profileName.disable()
        this.getAmtProfile(decodeURIComponent(params.name as string))
      }
    })
  }

  setConnectionMode(data: Profile): void {
    if (data.tlsMode != null) {
      this.profileForm.controls.connectionMode.setValue(this.connectionMode.tls)
    } else if (data.ciraConfigName != null) {
      this.profileForm.controls.connectionMode.setValue(this.connectionMode.cira)
    }
  }

  activationChange(value: string): void {
    if (value === 'ccmactivate') {
      this.profileForm.controls.userConsent.disable()
      this.profileForm.controls.userConsent.setValue('All')
      this.profileForm.controls.userConsent.clearValidators()
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPassword.clearValidators()
      this.profileForm.controls.generateRandomMEBxPassword.setValue(false)
      this.profileForm.controls.generateRandomMEBxPassword.disable()
    } else {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
      this.profileForm.controls.userConsent.enable()
      this.profileForm.controls.userConsent.setValidators(Validators.required)
      if (this.cloudMode) {
        this.profileForm.controls.generateRandomMEBxPassword.enable()
      }
    }
  }

  getAmtProfile(name: string): void {
    this.isLoading.set(true)
    this.profilesService
      .getRecord(name)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.pageTitle.set(data.profileName)
          this.tags.set(data.tags || [])
          this.profileForm.patchValue(data as any)
          this.selectedWifiConfigs.set(data.wifiConfigs ?? [])
          // Ensure proxy configs have proper priorities
          const proxies = data.proxyConfigs ?? []
          const proxiesWithPriorities = proxies.map((proxy: proxyConfig, index: number) => ({
            ...proxy,
            priority: proxy.priority || index + 1
          }))
          this.selectedProxyConfigs.set(proxiesWithPriorities)
          this.setConnectionMode(data)
        },
        error: (error) => {
          this.errorMessages.set(Array.isArray(error) ? error : [error])
        }
      })
  }

  private getCiraConfigs(): void {
    this.configsService.getData().subscribe({
      next: (ciraCfgRsp) => {
        this.ciraConfigurations.set(ciraCfgRsp.data)
      },
      error: (error) => {
        this.errorMessages.set(Array.isArray(error) ? error : [error])
      }
    })
  }

  private getIEEE8021xConfigs(): void {
    this.ieee8021xService.getData().subscribe({
      next: (rsp) => {
        const configs = rsp.data.filter((c) => c.wiredInterface)
        this.iee8021xConfigurations.set(configs)
      },
      error: (err) => {
        console.error(JSON.stringify(err))
        const errors = Array.isArray(err) ? err : [JSON.stringify(err)]
        this.errorMessages.set(errors)
      }
    })
  }

  private getWirelessConfigs(): void {
    this.wirelessService.getData().subscribe({
      next: (data) => {
        const configs = data.data.map((item) => item.profileName)
        this.wirelessConfigurations.set(configs)
      },
      error: (err) => {
        console.error(JSON.stringify(err))
        const errors = Array.isArray(err) ? err : [JSON.stringify(err)]
        this.errorMessages.set(errors)
      }
    })
  }

  private getProxyConfigs(): void {
    this.proxyConfigsService.getData().subscribe({
      next: (data) => {
        const configs = data.data.map((item) => item.name)
        this.ProxyConfigurations.set(configs)
      },
      error: (err) => {
        console.error(JSON.stringify(err))
        const errors = Array.isArray(err) ? err : [JSON.stringify(err)]
        this.errorMessages.set(errors)
      }
    })
  }

  generateRandomPasswordChange(value: boolean): void {
    if (value) {
      this.profileForm.controls.amtPassword.disable()
      this.profileForm.controls.amtPassword.setValue(null)
      this.profileForm.controls.amtPassword.clearValidators()
    } else {
      this.profileForm.controls.amtPassword.enable()
      this.profileForm.controls.amtPassword.setValidators(Validators.required)
    }
  }

  generateRandomMEBxPasswordChange(value: boolean): void {
    if (value) {
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPassword.clearValidators()
    } else if (this.profileForm.controls.activation.value === 'acmactivate') {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
    }
  }

  generateRandomPassword(length = 16): string {
    const charset = /[a-zA-Z0-9!$%]/
    const bit = new Uint8Array(1)
    let char = ''
    let password = ''
    let searching = true

    while (searching) {
      for (let i = 0; i < length; i++) {
        char = ''
        while (!charset.test(char)) {
          window.crypto.getRandomValues(bit)
          char = String.fromCharCode(bit[0])
        }
        password += char
      }

      searching = !this.PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password))
      if (searching) password = ''
    }

    return password
  }

  generateAMTPassword(): void {
    const password = this.generateRandomPassword()
    this.profileForm.controls.amtPassword.setValue(password)
  }

  generateMEBXPassword(): void {
    const password = this.generateRandomPassword()
    this.profileForm.controls.mebxPassword.setValue(password)
  }

  toggleAMTPassVisibility(): void {
    this.amtInputType.update((current) => (current === 'password' ? 'text' : 'password'))
  }

  toggleMEBXPassVisibility(): void {
    this.mebxInputType.update((current) => (current === 'password' ? 'text' : 'password'))
  }

  dhcpEnabledChange(isEnabled: boolean): void {
    if (isEnabled) {
      this.profileForm.controls.ipSyncEnabled.disable()
      this.profileForm.controls.ipSyncEnabled.setValue(true)
      this.profileForm.controls.ciraConfigName.enable()
      this.wirelessAutocomplete.reset({ value: '', disabled: false })
    } else {
      this.profileForm.controls.ipSyncEnabled.enable()
      this.profileForm.controls.ciraConfigName.enable()
      this.wirelessAutocomplete.reset({ value: '', disabled: true })
    }
  }

  connectionModeChange(value: string): void {
    if (value === this.connectionMode.tls) {
      this.profileForm.controls.ciraConfigName.clearValidators()
      this.profileForm.controls.ciraConfigName.setValue(null)
      this.profileForm.controls.tlsMode.setValidators(Validators.required)
      // set a default value if not set already
      if (!this.profileForm.controls.tlsSigningAuthority.value) {
        this.profileForm.controls.tlsSigningAuthority.setValue(this.tlsDefaultSigningAuthority)
      }
      this.profileForm.controls.tlsSigningAuthority.setValidators(Validators.required)
    } else if (value === this.connectionMode.cira) {
      this.profileForm.controls.tlsMode.clearValidators()
      this.profileForm.controls.tlsMode.setValue(null)
      this.profileForm.controls.tlsSigningAuthority.clearValidators()
      this.profileForm.controls.tlsSigningAuthority.setValue(null)
      this.profileForm.controls.ciraConfigName.setValidators(Validators.required)
    } else if (value === this.connectionMode.direct) {
      this.profileForm.controls.ciraConfigName.clearValidators()
      this.profileForm.controls.ciraConfigName.setValue(null)
      this.profileForm.controls.tlsMode.clearValidators()
      this.profileForm.controls.tlsMode.setValue(null)
      this.profileForm.controls.tlsSigningAuthority.clearValidators()
      this.profileForm.controls.tlsSigningAuthority.setValue(null)
    }

    this.profileForm.controls.ciraConfigName.updateValueAndValidity()
    this.profileForm.controls.tlsMode.updateValueAndValidity()
    this.profileForm.controls.tlsSigningAuthority.updateValueAndValidity()
  }

  selectWifiProfile(event: MatAutocompleteSelectedEvent): void {
    if (event.option.value === NO_WIFI_CONFIGS) return

    const selectedProfiles = this.selectedWifiConfigs().map((wifi) => wifi.profileName)
    if (selectedProfiles.includes(event.option.value as string)) return

    this.selectedWifiConfigs.update((configs) => [
      ...configs,
      {
        priority: configs.length + 1,
        profileName: event.option.value
      }
    ])

    this.wirelessAutocomplete.patchValue('')
  }

  selectProxyProfile(event: MatAutocompleteSelectedEvent): void {
    if (event.option.value === NO_PROXY_CONFIGS) return

    const selectedProfiles = this.selectedProxyConfigs().map((proxy) => proxy.name)
    if (selectedProfiles.includes(event.option.value as string)) return

    this.selectedProxyConfigs.update((configs) => [
      ...configs,
      {
        priority: configs.length + 1,
        name: event.option.value
      }
    ])

    this.proxyAutocomplete.patchValue('')
  }

  localWifiSyncChange(isEnabled: boolean): void {
    if (isEnabled) {
      this.profileForm.controls.localWifiSyncEnabled.disable()
      this.profileForm.controls.localWifiSyncEnabled.setValue(true)
      this.wirelessAutocomplete.reset({ value: '', disabled: false })
    } else {
      this.profileForm.controls.localWifiSyncEnabled.enable()
      this.wirelessAutocomplete.reset({ value: '', disabled: true })
    }
  }

  uefiWifiSyncChange(isEnabled: boolean): void {
    if (isEnabled) {
      this.profileForm.controls.uefiWifiSyncEnabled.disable()
      this.profileForm.controls.uefiWifiSyncEnabled.setValue(true)
      this.wirelessAutocomplete.reset({ value: '', disabled: false })
    } else {
      this.profileForm.controls.uefiWifiSyncEnabled.enable()
      this.wirelessAutocomplete.reset({ value: '', disabled: true })
    }
  }

  search(value: string): string[] {
    const filterValue = value.toLowerCase()
    const configs = this.wirelessConfigurations()
    const filteredValues = configs.filter((config) => config.toLowerCase().includes(filterValue))
    return filteredValues.length > 0 ? filteredValues : [NO_WIFI_CONFIGS]
  }

  searchProxy(value: string): string[] {
    const filterValue = value.toLowerCase()
    const configs = this.ProxyConfigurations()
    const filteredValues = configs.filter((config) => config.toLowerCase().includes(filterValue))
    return filteredValues.length > 0 ? filteredValues : [NO_PROXY_CONFIGS]
  }

  isSelectable(wifiOption: string): any {
    return {
      'no-results': wifiOption === NO_WIFI_CONFIGS
    }
  }

  isProxySelectable(proxyOption: string): any {
    return {
      'no-results': proxyOption === NO_PROXY_CONFIGS
    }
  }

  removeWifiProfile(wifiProfile: WiFiConfig): void {
    this.selectedWifiConfigs.update((configs) => {
      const filtered = configs.filter((config) => config !== wifiProfile)
      return this.updatePrioritiesForConfigs(filtered)
    })
  }

  removeProxyProfile(proxyProfile: proxyConfig): void {
    this.selectedProxyConfigs.update((configs) => {
      const filtered = configs.filter((config) => config !== proxyProfile)
      return this.updatePrioritiesForProxyConfigs(filtered)
    })
  }

  drop(event: CdkDragDrop<string[]>): void {
    this.selectedWifiConfigs.update((configs) => {
      const reordered = [...configs]
      moveItemInArray(reordered, event.previousIndex, event.currentIndex)
      return this.updatePrioritiesForConfigs(reordered)
    })
  }

  private updatePrioritiesForConfigs(configs: WiFiConfig[]): WiFiConfig[] {
    return configs.map((config, index) => ({
      ...config,
      priority: index + 1
    }))
  }

  updatePriorities(): void {
    this.selectedWifiConfigs.update((configs) => this.updatePrioritiesForConfigs(configs))
  }

  dropProxy(event: CdkDragDrop<string[]>): void {
    this.selectedProxyConfigs.update((configs) => {
      const reordered = [...configs]
      moveItemInArray(reordered, event.previousIndex, event.currentIndex)
      return this.updatePrioritiesForProxyConfigs(reordered)
    })
  }

  private updatePrioritiesForProxyConfigs(configs: proxyConfig[]): proxyConfig[] {
    return configs.map((config, index) => ({
      ...config,
      priority: index + 1
    }))
  }

  updateProxyPriorities(): void {
    this.selectedProxyConfigs.update((configs) => this.updatePrioritiesForProxyConfigs(configs))
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim()
    if (value === '' || this.tags().includes(value)) {
      event.chipInput?.clear()
      return
    }

    this.tags.update((currentTags) => [...currentTags, value].sort())
    event.chipInput?.clear()
  }

  remove(tag: string): void {
    this.tags.update((currentTags) => currentTags.filter((t) => t !== tag))
  }

  private CIRAStaticWarning(): Observable<any> {
    const dialog = this.dialog.open(StaticCIRAWarningComponent, this.matDialogConfig)
    return dialog.afterClosed()
  }

  private randPasswordWarning(): Observable<any> {
    const dialog = this.dialog.open(RandomPassAlertComponent, this.matDialogConfig)
    return dialog.afterClosed()
  }

  confirm(): void {
    // Warn user of risk if using random generated passwords
    // Warn user of risk if CIRA configuration and static network are selected simultaneously
    if (this.profileForm.valid) {
      const result: any = Object.assign({}, this.profileForm.getRawValue())
      const dialogs = []
      if (!this.isEdit() && (result.generateRandomPassword || result.generateRandomMEBxPassword)) {
        dialogs.push(this.randPasswordWarning())
      }
      if (result.connectionMode === this.connectionMode.cira && result.dhcpEnabled === false) {
        dialogs.push(this.CIRAStaticWarning())
      }

      if (dialogs.length === 0) {
        this.onSubmit()
        return
      }
      forkJoin(dialogs).subscribe((data) => {
        if (data.every((x) => x === true)) {
          this.onSubmit()
        }
      })
    } else {
      this.profileForm.markAllAsTouched()
    }
  }

  onSubmit(): void {
    this.isLoading.set(true)
    const result: Profile = Object.assign({}, this.profileForm.getRawValue()) as unknown as Profile
    result.tags = this.tags()
    delete (result as any).connectionMode

    if (result.dhcpEnabled) {
      result.wifiConfigs = this.selectedWifiConfigs()
    } else {
      result.wifiConfigs = []
    }

    // Always include proxy configurations
    result.proxyConfigs = this.selectedProxyConfigs()

    const request = this.isEdit() ? this.profilesService.update(result) : this.profilesService.create(result)

    request.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: () => {
        const completedMessage: string = this.translate.instant('common.completeProfile.value')
        this.snackBar.open(completedMessage, undefined, SnackbarDefaults.defaultError)
        void this.router.navigate(['/profiles'])
      },
      error: (error) => {
        this.errorMessages.set(Array.isArray(error) ? error : [error])
      }
    })
  }

  private createProfileForm() {
    return this.fb.group({
      profileName: ['', Validators.required],
      activation: ['acmactivate', Validators.required],
      generateRandomPassword: [
        { value: this.cloudMode, disabled: !this.cloudMode },
        Validators.required
      ],
      amtPassword: [{ value: null as string | null, disabled: this.cloudMode }],
      generateRandomMEBxPassword: [
        { value: this.cloudMode, disabled: !this.cloudMode },
        Validators.required
      ],
      mebxPassword: [{ value: null as string | null, disabled: this.cloudMode }],
      dhcpEnabled: [true],
      ipSyncEnabled: [{ value: true, disabled: true }],
      localWifiSyncEnabled: [{ value: false, disabled: false }],
      connectionMode: ['', Validators.required],
      ciraConfigName: [null as string | null],
      ieee8021xProfileName: [null as string | null],
      wifiConfigs: [[] as WiFiConfig[]],
      tlsMode: [2],
      tlsSigningAuthority: ['SelfSigned'],
      version: [''],
      userConsent: ['None', Validators.required],
      iderEnabled: [true, Validators.required],
      kvmEnabled: [true, Validators.required],
      solEnabled: [true, Validators.required],
      uefiWifiSyncEnabled: [{ value: false, disabled: false }]
    })
  }

  private setupWirelessFilter(): Observable<string[]> {
    return this.wirelessAutocomplete.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => {
        const searchValue = value || ''
        return searchValue.length > 0 ? this.search(searchValue) : []
      })
    )
  }

  private setupProxyFilter(): Observable<string[]> {
    return this.proxyAutocomplete.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => {
        const searchValue = value || ''
        return searchValue.length > 0 ? this.searchProxy(searchValue) : []
      })
    )
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/profiles'])
  }
}
