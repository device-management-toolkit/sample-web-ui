/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize, map, startWith } from 'rxjs/operators'
import { ConfigsService } from 'src/app/configs/configs.service'
import Constants from 'src/app/shared/config/Constants'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import {
  CIRAConfig,
  Profile,
  TlsMode,
  TlsSigningAuthority,
  WiFiProfile
} from 'src/models/models'
import { ProfilesService } from '../profiles.service'
import { RandomPassAlertComponent } from 'src/app/shared/random-pass-alert/random-pass-alert.component'
import { StaticCIRAWarningComponent } from 'src/app/shared/static-cira-warning/static-cira-warning.component'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { MatLegacyChipInputEvent as MatChipInputEvent } from '@angular/material/legacy-chips'
import { WirelessService } from 'src/app/wireless/wireless.service'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { forkJoin, Observable, of } from 'rxjs'
import {
  MatLegacyAutocompleteSelectedEvent as MatAutocompleteSelectedEvent
} from '@angular/material/legacy-autocomplete'
import { IEEE8021xService } from '../../ieee8021x/ieee8021x.service'
import * as IEEE8021x from '../../ieee8021x/ieee8021x.constants'

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss']
})
export class ProfileDetailComponent implements OnInit {
  public profileForm: FormGroup
  public activationModes = [
    { display: 'Admin Control Mode', value: Constants.ACMActivate },
    { display: 'Client Control Mode', value: Constants.CCMActivate }
  ]

  public userConsentModes = [
    { display: 'None', value: Constants.UserConsent_None },
    { display: 'All', value: Constants.UserConsent_All },
    { display: 'KVM Only', value: Constants.UserConsent_KVM }
  ]

  public ciraConfigurations: CIRAConfig[] = []
  public isLoading = false
  public pageTitle = 'New Profile'
  public isEdit = false
  public tags: string[] = []
  public selectedWifiConfigs: WiFiProfile[] = []
  public amtInputType = 'password'
  public mebxInputType = 'password'
  readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  public errorMessages: string[] = []
  public tlsModes: TlsMode[] = []
  public tlsSigningAuthorities: TlsSigningAuthority[] = []
  matDialogConfig: MatDialogConfig = {
    height: '225px',
    width: '450px'
  }

  iee8021xConfigurations: IEEE8021x.Config[] = []
  showIEEE8021xConfigurations: boolean = false
  wirelessConfigurations: string[] = []
  showWirelessConfigurations: boolean = false
  filteredWirelessList: Observable<string[]> = of([])
  wirelessAutocomplete = new FormControl()

  constructor (
    public snackBar: MatSnackBar,
    public fb: FormBuilder,
    public router: Router,
    private readonly activeRoute: ActivatedRoute,
    public profilesService: ProfilesService,
    private readonly configsService: ConfigsService,
    private readonly wirelessService: WirelessService,
    private readonly ieee8021xService: IEEE8021xService,
    public dialog: MatDialog
  ) {
    this.tlsModes = ProfilesService.TLS_MODES
    this.tlsSigningAuthorities = ProfilesService.TLS_SIGNING_AUTHORITIES
    this.profileForm = fb.group({
      profileName: [null, Validators.required],
      activation: [Constants.ACMActivate, Validators.required],
      generateRandomPassword: [true, Validators.required],
      amtPassword: [{ value: null, disabled: true }],
      generateRandomMEBxPassword: [true, Validators.required],
      mebxPassword: [{ value: null, disabled: true }],
      dhcpEnabled: [true],
      connectionMode: [null, Validators.required],
      ciraConfigName: [null],
      ieee8021xProfileName: [null],
      wifiConfigs: [null],
      tlsMode: [null],
      tlsSigningAuthority: [null],
      version: [null],
      // userConsent default depends on activation
      userConsent: [Constants.UserConsent_None, Validators.required],
      iderEnabled: [true, Validators.required],
      kvmEnabled: [true, Validators.required],
      solEnabled: [true, Validators.required]
    })
  }

  ngOnInit (): void {
    this.getIEEE8021xConfigs()
    this.getWirelessConfigs()
    this.getCiraConfigs()
    this.activeRoute.params.subscribe(params => {
      if (params.name) {
        this.isLoading = true
        this.isEdit = true
        this.profileForm.controls.profileName.disable()
        this.getAmtProfile(params.name)
      }
    })

    this.filteredWirelessList = this.wirelessAutocomplete.valueChanges.pipe(
      startWith(''),
      map(value => value.length > 0 ? this.search(value) : [])
    )
    this.profileForm.controls.activation?.valueChanges.subscribe(value => { this.activationChange(value) })
    this.profileForm.controls.generateRandomPassword?.valueChanges.subscribe(value => { this.generateRandomPasswordChange(value) })
    this.profileForm.controls.generateRandomMEBxPassword?.valueChanges.subscribe(value => { this.generateRandomMEBxPasswordChange(value) })
    this.profileForm.controls.dhcpEnabled?.valueChanges.subscribe(value => { this.networkConfigChange(value) })
    this.profileForm.controls.connectionMode?.valueChanges.subscribe(value => { this.connectionModeChange(value) })
  }

  setConnectionMode (data: Profile): void {
    if (data.tlsMode != null) {
      this.profileForm.controls.connectionMode.setValue(Constants.ConnectionMode_TLS)
    } else if (data.ciraConfigName != null) {
      this.profileForm.controls.connectionMode.setValue(Constants.ConnectionMode_CIRA)
    }
  }

  activationChange (value: string): void {
    if (value === Constants.CCMActivate) {
      this.profileForm.controls.userConsent.disable()
      this.profileForm.controls.userConsent.setValue(Constants.UserConsent_All)
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
      this.profileForm.controls.generateRandomMEBxPassword.enable()
    }
  }

  getAmtProfile (name: string): void {
    this.isLoading = true
    this.profilesService
      .getRecord(name)
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: data => {
          this.pageTitle = data.profileName
          this.tags = data.tags
          this.profileForm.patchValue(data)
          this.selectedWifiConfigs = data.wifiConfigs != null ? data.wifiConfigs : []
          this.setConnectionMode(data)
        },
        error: error => {
          this.errorMessages = error
        }
      })
  }

  getCiraConfigs (): void {
    this.configsService
      .getData()
      .subscribe({
        next: ciraCfgRsp => {
          this.ciraConfigurations = ciraCfgRsp.data
        },
        error: error => {
          this.errorMessages = error
        }
      })
  }

  getIEEE8021xConfigs (): void {
    this.ieee8021xService
      .getData()
      .subscribe({
        next: (rsp) => {
          this.iee8021xConfigurations = rsp.data.filter(c => c.wiredInterface)
          this.showIEEE8021xConfigurations = this.iee8021xConfigurations.length > 0
        },
        error: err => {
          console.log(JSON.stringify(err))
          if (err instanceof Array) {
            this.errorMessages = err
          } else {
            this.errorMessages.push(JSON.stringify(err))
          }
        }
      })
  }

  getWirelessConfigs (): void {
    this.wirelessService.getData().subscribe((data) => {
      this.wirelessConfigurations = data.data.map(item => item.profileName)
      this.showWirelessConfigurations = this.wirelessConfigurations.length > 0
    }, error => {
      this.errorMessages = error
    })
  }

  generateRandomPasswordChange (value: boolean): void {
    if (value) {
      this.profileForm.controls.amtPassword.disable()
      this.profileForm.controls.amtPassword.setValue(null)
      this.profileForm.controls.amtPassword.clearValidators()
    } else {
      this.profileForm.controls.amtPassword.enable()
      this.profileForm.controls.amtPassword.setValidators(Validators.required)
    }
  }

  generateRandomMEBxPasswordChange (value: boolean): void {
    if (value) {
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPassword.clearValidators()
    } else if (this.profileForm.controls.activation.value === Constants.ACMActivate) {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
    }
  }

  generateRandomPassword (length: number = 16): string {
    const charset: RegExp = /[a-zA-Z0-9!$%]/
    const requirements: RegExp[] = [/[a-z]/, /[A-Z]/, /[0-9]/, /[!$%]/]
    const bit = new Uint8Array(1)
    let char: string = ''
    let password: string = ''
    let searching: boolean = true

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

      for (let i = 0; i < requirements.length; i++) {
        if (!requirements[i].test(password)) {
          searching = true
          password = ''
        }
      }
    }
    return password
  }

  GenerateAMTPassword (): void {
    const password = this.generateRandomPassword()
    this.profileForm.controls.amtPassword.setValue(password)
  }

  GenerateMEBXPassword (): void {
    const password = this.generateRandomPassword()
    this.profileForm.controls.mebxPassword.setValue(password)
  }

  toggleAMTPassVisibility (): void {
    this.amtInputType = this.amtInputType === 'password' ? 'text' : 'password'
  }

  toggleMEBXPassVisibility (): void {
    this.mebxInputType = this.mebxInputType === 'password' ? 'text' : 'password'
  }

  networkConfigChange (value: boolean): void {
    if (!value) {
      this.profileForm.controls.ciraConfigName.enable()
      this.wirelessAutocomplete.reset({ value: '', disabled: true })
    } else {
      this.profileForm.controls.ciraConfigName.enable()
      this.wirelessAutocomplete.reset({ value: '', disabled: false })
    }
  }

  connectionModeChange (value: string): void {
    if (value === Constants.ConnectionMode_TLS) {
      this.profileForm.controls.ciraConfigName.clearValidators()
      this.profileForm.controls.ciraConfigName.setValue(null)
      this.profileForm.controls.tlsMode.setValidators(Validators.required)
      // set a default value if not set already
      if (!this.profileForm.controls.tlsSigningAuthority.value) {
        this.profileForm.controls.tlsSigningAuthority.setValue(ProfilesService.TLS_DEFAULT_SIGNING_AUTHORITY)
      }
      this.profileForm.controls.tlsSigningAuthority.setValidators(Validators.required)
    } else if (value === Constants.ConnectionMode_CIRA) {
      this.profileForm.controls.tlsMode.clearValidators()
      this.profileForm.controls.tlsMode.setValue(null)
      this.profileForm.controls.tlsSigningAuthority.clearValidators()
      this.profileForm.controls.tlsSigningAuthority.setValue(null)
      this.profileForm.controls.ciraConfigName.setValidators(Validators.required)
    }
    this.profileForm.controls.ciraConfigName.updateValueAndValidity()
    this.profileForm.controls.tlsMode.updateValueAndValidity()
    this.profileForm.controls.tlsSigningAuthority.updateValueAndValidity()
  }

  selectWifiProfile (event: MatAutocompleteSelectedEvent): void {
    if (event.option.value !== Constants.NORESULTS) {
      const selectedProfiles = this.selectedWifiConfigs.map(wifi => wifi.profileName)
      if (!selectedProfiles.includes(event.option.value)) {
        this.selectedWifiConfigs.push({
          priority: this.selectedWifiConfigs.length + 1,
          profileName: event.option.value
        })
      }
      this.wirelessAutocomplete.patchValue('')
    }
  }

  search (value: string): string[] {
    const filterValue = value.toLowerCase()
    const filteredValues = this.wirelessConfigurations.filter(config => config.toLowerCase().includes(filterValue))
    return filteredValues.length > 0 ? filteredValues : [Constants.NORESULTS]
  }

  isSelectable (wifiOption: string): any {
    return {
      'no-results': wifiOption === Constants.NORESULTS
    }
  }

  async cancel (): Promise<void> {
    await this.router.navigate(['/profiles'])
  }

  removeWifiProfile (wifiProfile: any): void {
    const index = this.selectedWifiConfigs.indexOf(wifiProfile)

    if (index >= 0) {
      this.selectedWifiConfigs.splice(index, 1)
    }
    this.updatePriorities()
  }

  remove (tag: string): void {
    const index = this.tags.indexOf(tag)

    if (index >= 0) {
      this.tags.splice(index, 1)
    }
  }

  drop (event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.selectedWifiConfigs, event.previousIndex, event.currentIndex)
    this.updatePriorities()
  }

  updatePriorities (): void {
    let index = 1
    this.selectedWifiConfigs.map(x => {
      x.priority = index++
      return x
    })
  }

  add (event: MatChipInputEvent): void {
    const input = event.input
    const value = event.value

    // Add our fruit
    if ((value || '').trim()) {
      this.tags.push(value.trim())
    }

    // Reset the input value
    if (input) {
      input.value = ''
    }
  }

  CIRAStaticWarning (): Observable<any> {
    const dialog = this.dialog.open(StaticCIRAWarningComponent, this.matDialogConfig)
    return dialog.afterClosed()
  }

  randPasswordWarning (): Observable<any> {
    const dialog = this.dialog.open(RandomPassAlertComponent, this.matDialogConfig)
    return dialog.afterClosed()
  }

  confirm (): void {
    // Warn user of risk if using random generated passwords
    // Warn user of risk if CIRA configuration and static network are selected simultaneously
    if (this.profileForm.valid) {
      const result: any = Object.assign({}, this.profileForm.getRawValue())
      const dialogs = []
      if (!this.isEdit && (result.generateRandomPassword || result.generateRandomMEBxPassword)) {
        dialogs.push(this.randPasswordWarning())
      }
      if (result.connectionMode === Constants.ConnectionMode_CIRA && result.dhcpEnabled === false) {
        dialogs.push(this.CIRAStaticWarning())
      }

      if (dialogs.length === 0) {
        this.onSubmit()
        return
      }
      forkJoin(dialogs).subscribe(data => {
        if (data.every((x) => x === true)) {
          this.onSubmit()
        }
      })
    } else {
      this.profileForm.markAllAsTouched()
    }
  }

  onSubmit (): void {
    this.isLoading = true
    const result: any = Object.assign({}, this.profileForm.getRawValue())
    result.tags = this.tags
    delete result.connectionMode
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
        finalize(() => { this.isLoading = false })
      )
      .subscribe({
        next: () => {
          this.snackBar.open($localize`Profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
          void this.router.navigate(['/profiles'])
        },
        error: error => {
          this.errorMessages = error
        }
      })
  }
}
