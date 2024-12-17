/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize, map, startWith } from 'rxjs/operators'
import { ConfigsService } from 'src/app/configs/configs.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { ProfilesService } from '../profiles.service'
import { RandomPassAlertComponent } from 'src/app/shared/random-pass-alert/random-pass-alert.component'
import { StaticCIRAWarningComponent } from 'src/app/shared/static-cira-warning/static-cira-warning.component'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { MatChipInputEvent, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput } from '@angular/material/chips'
import { WirelessService } from 'src/app/wireless/wireless.service'
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop'
import { forkJoin, Observable, of } from 'rxjs'
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete'
import { IEEE8021xService } from '../../ieee8021x/ieee8021x.service'
import {
  ActivationModes,
  Profile,
  TlsModes,
  TlsSigningAuthorities,
  UserConsentModes,
  WiFiConfig
} from '../profiles.constants'
import { NgClass, AsyncPipe } from '@angular/common'
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton, MatButton } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatOption } from '@angular/material/core'
import { MatSelect } from '@angular/material/select'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel, MatError, MatHint, MatSuffix } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list'
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatToolbar } from '@angular/material/toolbar'
import { environment } from 'src/environments/environment'
import { CIRAConfig, IEEE8021xConfig } from 'src/models/models'

const NO_WIFI_CONFIGS = 'No Wifi Configs Found'

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
    AsyncPipe
  ]
})
export class ProfileDetailComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  fb = inject(FormBuilder)
  router = inject(Router)
  private readonly activeRoute = inject(ActivatedRoute)
  profilesService = inject(ProfilesService)
  private readonly configsService = inject(ConfigsService)
  private readonly wirelessService = inject(WirelessService)
  private readonly ieee8021xService = inject(IEEE8021xService)
  dialog = inject(MatDialog)

  profileForm: FormGroup
  pageTitle = 'New Profile'
  isLoading = false
  isEdit = false
  activationModes = ActivationModes
  userConsentModes = UserConsentModes
  tlsModes = TlsModes
  tlsSigningAuthorities = TlsSigningAuthorities
  tlsDefaultSigningAuthority = 'SelfSigned'
  ciraConfigurations: CIRAConfig[] = []
  tags: string[] = []
  selectedWifiConfigs: WiFiConfig[] = []
  amtInputType = 'password'
  mebxInputType = 'password'
  readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  errorMessages: string[] = []
  matDialogConfig: MatDialogConfig = {
    height: '275px',
    width: '450px'
  }

  cloudMode = environment.cloud
  iee8021xConfigurations: IEEE8021xConfig[] = []
  showIEEE8021xConfigurations = false
  wirelessConfigurations: string[] = []
  showWirelessConfigurations = false
  filteredWirelessList: Observable<string[]> = of([])
  wirelessAutocomplete = new FormControl()
  tooltipIpSyncEnabled = 'Only applicable for static wired network config'
  connectionMode = {
    cira: 'CIRA',
    tls: 'TLS',
    direct: 'DIRECT'
  }

  constructor() {
    const fb = this.fb

    this.profileForm = fb.group({
      profileName: [null, Validators.required],
      activation: ['acmactivate', Validators.required],
      generateRandomPassword: [
        { value: this.cloudMode, disabled: !this.cloudMode },
        Validators.required
      ],
      amtPassword: [{ value: null, disabled: this.cloudMode }],
      generateRandomMEBxPassword: [
        { value: this.cloudMode, disabled: !this.cloudMode },
        Validators.required
      ],
      mebxPassword: [{ value: null, disabled: this.cloudMode }],
      dhcpEnabled: [true],
      ipSyncEnabled: [{ value: true, disabled: true }],
      localWifiSyncEnabled: [{ value: false, disabled: false }],
      connectionMode: [null, Validators.required],
      ciraConfigName: [null],
      ieee8021xProfileName: [null],
      wifiConfigs: [null],
      tlsMode: [null],
      tlsSigningAuthority: [null],
      version: [null],
      // userConsent default depends on activation
      userConsent: ['None', Validators.required],
      iderEnabled: [true, Validators.required],
      kvmEnabled: [true, Validators.required],
      solEnabled: [true, Validators.required]
    })
  }

  ngOnInit(): void {
    this.getIEEE8021xConfigs()
    this.getWirelessConfigs()
    this.getCiraConfigs()
    this.activeRoute.params.subscribe((params) => {
      if (params.name) {
        this.isLoading = true
        this.isEdit = true
        this.profileForm.controls.profileName.disable()
        this.getAmtProfile(decodeURIComponent(params.name as string))
      }
    })

    this.filteredWirelessList = this.wirelessAutocomplete.valueChanges.pipe(
      startWith(''),
      map((value: string) => (value.length > 0 ? this.search(value) : []))
    )
    this.profileForm.controls.activation?.valueChanges.subscribe((value: string) => {
      this.activationChange(value)
    })
    this.profileForm.controls.generateRandomPassword.valueChanges.subscribe((value: boolean) => {
      this.generateRandomPasswordChange(value)
    })
    this.profileForm.controls.generateRandomMEBxPassword.valueChanges.subscribe((value: boolean) => {
      this.generateRandomMEBxPasswordChange(value)
    })
    this.profileForm.controls.dhcpEnabled.valueChanges.subscribe((value: boolean) => {
      this.dhcpEnabledChange(value)
    })
    this.profileForm.controls.connectionMode.valueChanges.subscribe((value: string) => {
      this.connectionModeChange(value)
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
    this.isLoading = true
    this.profilesService
      .getRecord(name)
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: (data) => {
          this.pageTitle = data.profileName
          this.tags = data.tags
          this.profileForm.patchValue(data)
          this.selectedWifiConfigs = data.wifiConfigs ?? []
          this.setConnectionMode(data)
        },
        error: (error) => {
          this.errorMessages = error
        }
      })
  }

  getCiraConfigs(): void {
    this.configsService.getData().subscribe({
      next: (ciraCfgRsp) => {
        this.ciraConfigurations = ciraCfgRsp.data
      },
      error: (error) => {
        this.errorMessages = error
      }
    })
  }

  getIEEE8021xConfigs(): void {
    this.ieee8021xService.getData().subscribe({
      next: (rsp) => {
        this.iee8021xConfigurations = rsp.data.filter((c) => c.wiredInterface)
        this.showIEEE8021xConfigurations = this.iee8021xConfigurations.length > 0
      },
      error: (err) => {
        console.error(JSON.stringify(err))
        if (err instanceof Array) {
          this.errorMessages = err
        } else {
          this.errorMessages.push(JSON.stringify(err))
        }
      }
    })
  }

  getWirelessConfigs(): void {
    this.wirelessService.getData().subscribe({
      next: (data) => {
        this.wirelessConfigurations = data.data.map((item) => item.profileName)
        this.showWirelessConfigurations = this.wirelessConfigurations.length > 0
      },
      error: (err) => {
        console.error(JSON.stringify(err))
        if (err instanceof Array) {
          this.errorMessages = err
        } else {
          this.errorMessages.push(JSON.stringify(err))
        }
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
    const requirements: RegExp[] = [
      /[a-z]/,
      /[A-Z]/,
      /[0-9]/,
      /[!$%]/
    ]
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

      searching = false

      for (const requirement of requirements) {
        if (!requirement.test(password)) {
          searching = true
          password = ''
          break
        }
      }
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
    this.amtInputType = this.amtInputType === 'password' ? 'text' : 'password'
  }

  toggleMEBXPassVisibility(): void {
    this.mebxInputType = this.mebxInputType === 'password' ? 'text' : 'password'
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
    if (event.option.value !== NO_WIFI_CONFIGS) {
      const selectedProfiles = this.selectedWifiConfigs.map((wifi) => wifi.profileName)
      if (!selectedProfiles.includes(event.option.value as string)) {
        this.selectedWifiConfigs.push({
          priority: this.selectedWifiConfigs.length + 1,
          profileName: event.option.value
        })
      }
      this.wirelessAutocomplete.patchValue('')
    }
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

  search(value: string): string[] {
    const filterValue = value.toLowerCase()
    const filteredValues = this.wirelessConfigurations.filter((config) => config.toLowerCase().includes(filterValue))
    return filteredValues.length > 0 ? filteredValues : [NO_WIFI_CONFIGS]
  }

  isSelectable(wifiOption: string): any {
    return {
      'no-results': wifiOption === NO_WIFI_CONFIGS
    }
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/profiles'])
  }

  removeWifiProfile(wifiProfile: WiFiConfig): void {
    const index = this.selectedWifiConfigs.indexOf(wifiProfile)

    if (index >= 0) {
      this.selectedWifiConfigs.splice(index, 1)
    }
    this.updatePriorities()
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.selectedWifiConfigs, event.previousIndex, event.currentIndex)
    this.updatePriorities()
  }

  updatePriorities(): void {
    let index = 1
    this.selectedWifiConfigs.map((x) => {
      x.priority = index++
      return x
    })
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim()
    if (value !== '' && !this.tags.includes(value)) {
      this.tags.push(value)
      this.tags.sort()
    }
    event.chipInput?.clear()
  }

  remove(tag: string): void {
    const index = this.tags.indexOf(tag)

    if (index >= 0) {
      this.tags.splice(index, 1)
    }
  }

  CIRAStaticWarning(): Observable<any> {
    const dialog = this.dialog.open(StaticCIRAWarningComponent, this.matDialogConfig)
    return dialog.afterClosed()
  }

  randPasswordWarning(): Observable<any> {
    const dialog = this.dialog.open(RandomPassAlertComponent, this.matDialogConfig)
    return dialog.afterClosed()
  }

  confirm(): void {
    // Warn user of risk if using random generated passwords
    // Warn user of risk if CIRA configuration and static network are selected simultaneously
    if (this.profileForm.valid) {
      const result: any = Object.assign({}, this.profileForm.getRawValue())
      const dialogs = []
      if (!this.isEdit && (result.generateRandomPassword || result.generateRandomMEBxPassword)) {
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
    this.isLoading = true
    const result: Profile = Object.assign({}, this.profileForm.getRawValue())
    result.tags = this.tags
    delete (result as any).connectionMode
    if (result.dhcpEnabled) {
      result.wifiConfigs = this.selectedWifiConfigs
    } else {
      result.wifiConfigs = [] // Empty the wifi configs for static network
    }
    let request
    let reqType: string
    if (this.isEdit) {
      request = this.profilesService.update(result)
      reqType = 'updated'
    } else {
      request = this.profilesService.create(result)
      reqType = 'created'
    }
    request
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open($localize`Profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
          void this.router.navigate(['/profiles'])
        },
        error: (error) => {
          this.errorMessages = error
        }
      })
  }
}
