/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize, map, startWith } from 'rxjs/operators'
import { ConfigsService } from 'src/app/configs/configs.service'
import Constants from 'src/app/shared/config/Constants'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { CIRAConfig, WiFiProfile } from 'src/models/models'
import { ProfilesService } from '../profiles.service'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { MatChipInputEvent } from '@angular/material/chips'
import { WirelessService } from 'src/app/wireless/wireless.service'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { Observable, of } from 'rxjs'
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss']
})
export class ProfileDetailComponent implements OnInit {
  public profileForm: FormGroup
  public activationModes = [{ display: 'Admin Control Mode', value: Constants.ACMActivate }, { display: 'Client Control Mode', value: Constants.CCMActivate }]
  public ciraConfigurations: CIRAConfig[] = []
  public isLoading = false
  public pageTitle = 'New Profile'
  public isEdit = false
  public tags: string[] = []
  public selectedWifiConfigs: WiFiProfile[] = []
  readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  public errorMessages: string[] = []
  wirelessConfigurations: string[] = []
  filteredWifiList: Observable<string[]> = of([])
  wifiAutocomplete = new FormControl()

  constructor (public snackBar: MatSnackBar, public fb: FormBuilder, public router: Router, private readonly activeRoute: ActivatedRoute,
    public profilesService: ProfilesService, private readonly configsService: ConfigsService, private readonly wirelessService: WirelessService) {
    this.profileForm = fb.group({
      profileName: [null, Validators.required],
      activation: [this.activationModes[0].value, Validators.required],
      amtPassword: [null, Validators.required],
      generateRandomPassword: [false, Validators.required],
      generateRandomMEBxPassword: [false, Validators.required],
      mebxPasswordLength: [{ value: null, disabled: true }],
      passwordLength: [{ value: null, disabled: true }],
      mebxPassword: [null, Validators.required],
      dhcpEnabled: [true],
      ciraConfigName: [null],
      wifiConfigs: [null]
    })
  }

  ngOnInit (): void {
    this.activeRoute.params.subscribe(params => {
      this.getWirelessConfigs()
      if (params.name != null && params.name !== '') {
        this.isLoading = true
        this.profilesService.getRecord(params.name)
          .pipe(
            finalize(() => {
              this.isLoading = false
            })
          ).subscribe(data => {
            this.isEdit = true
            this.profileForm.controls.profileName.disable()
            this.pageTitle = data.profileName
            this.tags = data.tags
            this.profileForm.patchValue(data)
            this.selectedWifiConfigs = data.wifiConfigs != null ? data.wifiConfigs : []
          }, error => {
            this.errorMessages = error
          })
      }
    })

    this.configsService.getData().subscribe(data => {
      this.ciraConfigurations = data
    }, error => {
      this.errorMessages = error
    })
    this.filteredWifiList = this.wifiAutocomplete.valueChanges.pipe(
      startWith(''),
      map(value => this.search(value))
    )
    this.profileForm.controls.activation?.valueChanges.subscribe(value => this.activationChange(value))
    this.profileForm.controls.generateRandomPassword?.valueChanges.subscribe(value => this.generateRandomPasswordChange(value))
    this.profileForm.controls.generateRandomMEBxPassword?.valueChanges.subscribe(value => this.generateRandomMEBxPasswordChange(value))
    this.profileForm.controls.dhcpEnabled?.valueChanges.subscribe(value => this.networkConfigChange(value))
  }

  activationChange (value: string): void {
    if (value === Constants.CCMActivate) {
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPassword.clearValidators()
      this.profileForm.controls.mebxPasswordLength.disable()
      this.profileForm.controls.mebxPasswordLength.setValue(null)
      this.profileForm.controls.mebxPasswordLength.clearValidators()
      this.profileForm.controls.generateRandomMEBxPassword.setValue(false)
      this.profileForm.controls.generateRandomMEBxPassword.disable()
      this.profileForm.controls.generateRandomMEBxPassword.clearValidators()
    } else {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
      this.profileForm.controls.mebxPasswordLength.enable()
      this.profileForm.controls.mebxPasswordLength.setValidators([Validators.max(32), Validators.min(8)])
      this.profileForm.controls.generateRandomMEBxPassword.enable()
      this.profileForm.controls.generateRandomMEBxPassword.setValidators(Validators.required)
    }
  }

  getWirelessConfigs (): void {
    this.wirelessService.getData().subscribe(data => {
      this.wirelessConfigurations = data.map(item => item.profileName)
    }, error => {
      this.errorMessages = error
    })
  }

  generateRandomPasswordChange (value: boolean): void {
    if (value) {
      this.profileForm.controls.amtPassword.disable()
      this.profileForm.controls.amtPassword.setValue(null)
      this.profileForm.controls.amtPassword.clearValidators()
      this.profileForm.controls.amtPassword.setValue(null)
      this.profileForm.controls.passwordLength.setValue(8)
      this.profileForm.controls.passwordLength.enable()
    } else {
      this.profileForm.controls.amtPassword.enable()
      this.profileForm.controls.amtPassword.setValidators(Validators.required)
      this.profileForm.controls.passwordLength.disable()
      this.profileForm.controls.passwordLength.setValue(null)
      this.profileForm.controls.passwordLength.clearValidators()
    }
  }

  generateRandomMEBxPasswordChange (value: boolean): void {
    if (value) {
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPassword.clearValidators()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPasswordLength.setValue(8)
      this.profileForm.controls.mebxPasswordLength.enable()
    } else if (this.profileForm.controls.activation.value === Constants.ACMActivate) {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
      this.profileForm.controls.mebxPasswordLength.disable()
      this.profileForm.controls.mebxPasswordLength.setValue(null)
      this.profileForm.controls.mebxPasswordLength.clearValidators()
    }
  }

  networkConfigChange (value: boolean): void {
    if (!value) {
      this.profileForm.controls.ciraConfigName.disable()
      this.wifiAutocomplete.reset({ value: '', disabled: true })
      this.profileForm.controls.ciraConfigName.setValue(null)
    } else {
      this.profileForm.controls.ciraConfigName.enable()
      this.wifiAutocomplete.reset({ value: '', disabled: false })
    }
  }

  selectWifiProfile (event: MatAutocompleteSelectedEvent): void {
    const selectedProfiles = this.selectedWifiConfigs.map(wifi => wifi.profileName)
    if (!selectedProfiles.includes(event.option.value)) {
      this.selectedWifiConfigs.push({ priority: this.selectedWifiConfigs.length + 1, profileName: event.option.value })
    }
    this.wifiAutocomplete.patchValue('')
  }

  search (value: string): string[] {
    const filterValue = value.toLowerCase()
    return this.wirelessConfigurations.filter(config => config.toLowerCase().includes(filterValue))
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
    this.selectedWifiConfigs.map(x => { x.priority = index++; return x })
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

  onSubmit (): void {
    if (this.profileForm.valid) {
      this.isLoading = true
      const result: any = Object.assign({}, this.profileForm.getRawValue())
      result.tags = this.tags
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
          }))
        .subscribe(data => {
          this.snackBar.open($localize`Profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.router.navigate(['/profiles'])
        }, error => {
          this.errorMessages = error
        })
    }
  }
}
