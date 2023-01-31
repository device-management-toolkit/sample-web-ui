/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatLegacyCheckboxChange as MatCheckboxChange } from '@angular/material/legacy-checkbox'
import { MatLegacySelectChange as MatSelectChange } from '@angular/material/legacy-select'
import { MatLegacyTabChangeEvent as MatTabChangeEvent } from '@angular/material/legacy-tabs'
import { timer } from 'rxjs'
import { ProfilesService } from 'src/app/profiles/profiles.service'
import { environment } from 'src/environments/environment'
import { ProfileResponse } from 'src/models/models'

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss']
})
export class AddDeviceComponent implements OnInit {
  profiles: ProfileResponse = { data: [], totalCount: 0 }
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
    this.profilesService.getData().subscribe((data: ProfileResponse) => {
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
