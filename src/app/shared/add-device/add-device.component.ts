/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox'
import { MatSelectChange, MatSelect } from '@angular/material/select'
import { MatTabChangeEvent, MatTabGroup, MatTab } from '@angular/material/tabs'
import { timer } from 'rxjs'
import { ProfilesService } from 'src/app/profiles/profiles.service'
import { environment } from 'src/environments/environment'
import { MatIcon } from '@angular/material/icon'
import { CdkCopyToClipboard } from '@angular/cdk/clipboard'
import { MatIconButton } from '@angular/material/button'
import { MatInput } from '@angular/material/input'
import { MatOption } from '@angular/material/core'
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog'
import { DataWithCount } from 'src/models/models'
import { Profile } from 'src/app/profiles/profiles.constants'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatError,
    MatTabGroup,
    MatTab,
    MatInput,
    MatIconButton,
    MatSuffix,
    CdkCopyToClipboard,
    MatIcon,
    TranslateModule,
    ReactiveFormsModule
  ]
})
export class AddDeviceComponent implements OnInit {
  private readonly profilesService = inject(ProfilesService)
  private readonly fb = inject(FormBuilder)

  // Signals for reactive state management
  profiles = signal<DataWithCount<Profile>>({ data: [], totalCount: 0 })
  selectedPlatform = signal<string>('linux')
  isCopied = signal<boolean>(false)
  formValues = signal({
    profile: 'activate',
    certCheck: true,
    verbose: false
  })

  // Form group for reactive forms
  deviceForm: FormGroup

  // Constants for command generation
  private readonly rpcCommands = {
    linux: 'sudo ./rpc ',
    windows: 'rpc.exe ',
    docker: 'sudo docker run --device=/dev/mei0 rpc:latest '
  } as const

  private readonly serverUrl = `-u wss://${this.formServerUrl()}/activate `

  // Computed activation URL based on form values and platform
  activationUrl = computed(() => {
    const platform = this.selectedPlatform()
    const values = this.formValues()
    const profile = values.profile || 'activate'
    const certCheck = values.certCheck ? '-n ' : ''
    const verbose = values.verbose ? '-v ' : ''

    const rpcCommand = this.rpcCommands[platform as keyof typeof this.rpcCommands]
    const profileCommand = profile === 'activate' ? 'activate' : `activate -profile ${profile}`

    return `${rpcCommand}${profileCommand} ${this.serverUrl}${certCheck}${verbose}`
  })

  constructor() {
    this.deviceForm = this.fb.group({
      profile: ['activate', Validators.required],
      certCheck: [true],
      verbose: [false]
    })

    // Update signal when form values change
    this.deviceForm.valueChanges.subscribe((values) => {
      this.formValues.set(values)
    })
  }

  ngOnInit(): void {
    this.profilesService.getData().subscribe((data) => {
      this.profiles.set(data)
    })

    // Set initial form values
    this.formValues.set(this.deviceForm.value)
  }

  tabChange(event: MatTabChangeEvent): void {
    this.selectedPlatform.set(event.tab.textLabel.toLowerCase())
  }

  formServerUrl(): string {
    let serverUrl = ''
    const url = environment.rpsServer.substring(environment.rpsServer.indexOf('://') + 3)
    if (url.includes(':')) {
      serverUrl += url.substring(0, url.indexOf(':'))
    } else if (url.includes('/')) {
      serverUrl += url.substring(0, url.indexOf('/'))
    }
    return serverUrl
  }

  profileChange(event: MatSelectChange): void {
    this.deviceForm.get('profile')?.setValue(event.value as string)
  }

  onCopy(): void {
    this.isCopied.set(true)
    timer(2000).subscribe(() => {
      this.isCopied.set(false)
    })
  }

  isActivationCommandDisabled(): boolean {
    const profileValue = this.formValues().profile
    return profileValue === 'activate'
  }

  updateCertCheck(event: MatCheckboxChange): void {
    this.deviceForm.get('certCheck')?.setValue(event.checked)
  }

  updateVerboseCheck(event: MatCheckboxChange): void {
    this.deviceForm.get('verbose')?.setValue(event.checked)
  }
}
