/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox'
import { MatSelectChange, MatSelect } from '@angular/material/select'
import { MatTabChangeEvent, MatTabGroup, MatTab } from '@angular/material/tabs'
import { timer } from 'rxjs'
import { ProfilesService } from 'src/app/profiles/profiles.service'
import { environment } from 'src/environments/environment'
import { ProfilesResponse } from '../../profiles/profiles.constants'
import { MatIcon } from '@angular/material/icon'
import { CdkCopyToClipboard } from '@angular/cdk/clipboard'
import { MatIconButton } from '@angular/material/button'
import { MatInput } from '@angular/material/input'
import { MatOption } from '@angular/material/core'
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog'

@Component({
    selector: 'app-add-device',
    templateUrl: './add-device.component.html',
    styleUrls: ['./add-device.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatCheckbox, MatFormField, MatLabel, MatSelect, MatOption, MatError, MatTabGroup, MatTab, MatInput, MatIconButton, MatSuffix, CdkCopyToClipboard, MatIcon]
})
export class AddDeviceComponent implements OnInit {
  profiles: ProfilesResponse = { data: [], totalCount: 0 }
  activationUrl: string = ''
  rpcLinux: string = 'sudo ./rpc '
  rpcDocker: string = 'sudo docker run --device=/dev/mei0 rpc:latest '
  rpcWindows: string = 'rpc.exe '
  serverUrl: string = `-u wss://${this.formServerUrl()}/activate `
  selectedProfile: string = 'activate'
  verboseString: string = ''
  certCheckString: string = '-n '
  isCopied: boolean = false
  selectedPlatform: string = 'linux'
  constructor (private readonly profilesService: ProfilesService) {
  }

  ngOnInit (): void {
    this.profilesService.getData().subscribe((data: ProfilesResponse) => {
      this.profiles = data
    })
    this.formActivationUrl()
  }

  tabChange (event: MatTabChangeEvent): void {
    this.selectedPlatform = event.tab.textLabel.toLowerCase()
    this.formActivationUrl()
  }

  formActivationUrl (): void {
    switch (this.selectedPlatform) {
      case 'linux':
        this.activationUrl = this.rpcLinux
        break
      case 'windows':
        this.activationUrl = this.rpcWindows
        break
      case 'docker':
        this.activationUrl = this.rpcDocker
        break
    }
    this.activationUrl += `${this.selectedProfile} ${this.serverUrl}${this.certCheckString}${this.verboseString}`
  }

  formServerUrl (): string {
    let serverUrl: string = ''
    const url = environment.rpsServer.substring(environment.rpsServer.indexOf('://') + 3)
    if (url.includes(':')) {
      serverUrl += url.substring(0, url.indexOf(':'))
    } else if (url.includes('/')) {
      serverUrl += url.substring(0, url.indexOf('/'))
    }
    return serverUrl
  }

  profileChange (event: MatSelectChange): void {
    this.selectedProfile = `activate -profile ${event.value as string}`
    this.formActivationUrl()
  }

  onCopy (): void {
    this.isCopied = true
    timer(2000).subscribe(() => {
      this.isCopied = false
    })
  }

  isActivationCommandDisabled (): boolean {
    return this.selectedProfile === 'activate'
  }

  updateCertCheck (event: MatCheckboxChange): void {
    this.certCheckString = event.checked ? '-n ' : ''
    this.formActivationUrl()
  }

  updateVerboseCheck (event: MatCheckboxChange): void {
    this.verboseString = event.checked ? '-v ' : ''
    this.formActivationUrl()
  }
}
