/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatTabChangeEvent } from '@angular/material/tabs'
import { of } from 'rxjs'
import { delay } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { VaultService } from './vault.service'

@Component({
  selector: 'app-deactivate-device',
  templateUrl: './deactivate-device.component.html',
  styleUrls: ['./deactivate-device.component.scss']
})
export class DeactivateDeviceComponent implements OnInit {
  vaultForm: FormGroup
  hasRetrievedPassword: boolean = false
  rpcLinux: string = 'sudo ./rpc '
  rpcDocker: string = 'sudo docker run --device=/dev/mei0 rpc:latest '
  rpcWindows: string = 'rpc.exe '
  deactivationUrl: string = ''
  serverUrl: string = `-u wss://${this.formServerUrl()}/activate `
  deactivationCommand: string = ''
  isCopied: boolean = false
  error: boolean = false
  selectedPlatform: string = 'linux'
  constructor (@Inject(MAT_DIALOG_DATA) public data: { id: string }, public fb: FormBuilder, private readonly vaultService: VaultService) {
    this.vaultForm = fb.group({
      vaultToken: [null, Validators.required]
    })
  }

  ngOnInit (): void {
    this.formDeactivationUrl()
  }

  formDeactivationUrl (): void {
    switch (this.selectedPlatform.toLowerCase()) {
      case 'linux':
        this.deactivationUrl = this.rpcLinux
        break
      case 'windows':
        this.deactivationUrl = this.rpcWindows
        break
      case 'docker':
        this.deactivationUrl = this.rpcDocker
        break
    }
    this.deactivationUrl += `${this.serverUrl}${this.deactivationCommand}`
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

  onSubmit (): void {
    if (this.vaultForm.valid) {
      const result: any = Object.assign({}, this.vaultForm.value)
      this.vaultService.getPassword(this.data.id, result.vaultToken)
        .subscribe(response => {
          this.error = false
          this.deactivationCommand = `-c '-t deactivate --password ${response.data.data.AMT_PASSWORD as string}'`
          this.formDeactivationUrl()
          this.hasRetrievedPassword = true
        }, () => {
          this.error = true
        })
    }
  }

  tabChange (event: MatTabChangeEvent): void {
    this.selectedPlatform = event.tab.textLabel
    this.formDeactivationUrl()
  }

  onCopy (): void {
    this.isCopied = true
    of(this.isCopied).pipe(delay(2000)).subscribe(
      () => {
        this.isCopied = false
      }
    )
  }
}
