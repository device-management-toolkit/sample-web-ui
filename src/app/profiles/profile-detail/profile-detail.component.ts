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
import { CIRAConfigResponse, WiFiProfile, WirelessConfigResponse } from 'src/models/models'
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
  public ciraConfigurations: CIRAConfigResponse = { data: [], totalCount: 0 }
  public isLoading = false
  public pageTitle = 'New Profile'
  public isEdit = false
  public tags: string[] = []
  public selectedWifiConfigs: WiFiProfile[] = []
  public amtInputType = 'password'
  public mebxInputType = 'password'
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
      map(value => value.length > 0 ? this.search(value) : [])
    )
    this.profileForm.controls.activation?.valueChanges.subscribe(value => this.activationChange(value))
    this.profileForm.controls.dhcpEnabled?.valueChanges.subscribe(value => this.networkConfigChange(value))
    this.profileForm.controls.ciraConfigName?.valueChanges.subscribe(value => this.ciraConfigChange(value))
  }

  activationChange (value: string): void {
    if (value === Constants.CCMActivate) {
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPassword.clearValidators()
    } else {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
    }
  }

  getWirelessConfigs (): void {
    this.wirelessService.getData().subscribe((data: WirelessConfigResponse) => {
      this.wirelessConfigurations = data.data.map(item => item.profileName)
    }, error => {
      this.errorMessages = error
    })
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
      this.profileForm.controls.ciraConfigName.disable()
      this.wifiAutocomplete.reset({ value: '', disabled: true })
      this.profileForm.controls.ciraConfigName.setValue(null)
    } else {
      this.profileForm.controls.ciraConfigName.enable()
      this.wifiAutocomplete.reset({ value: '', disabled: false })
    }
  }

  ciraConfigChange (value: string): void {
    if (value === Constants.NOCONFIGSELECTED) {
      this.profileForm.controls.ciraConfigName.setValue(null)
    }
  }

  selectWifiProfile (event: MatAutocompleteSelectedEvent): void {
    if (event.option.value !== Constants.NORESULTS) {
      const selectedProfiles = this.selectedWifiConfigs.map(wifi => wifi.profileName)
      if (!selectedProfiles.includes(event.option.value)) {
        this.selectedWifiConfigs.push({ priority: this.selectedWifiConfigs.length + 1, profileName: event.option.value })
      }
      this.wifiAutocomplete.patchValue('')
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
