/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatFormField, MatLabel, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { MatOption } from '@angular/material/core'
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs/operators'
import { ProfilesService } from '../profiles/profiles.service'
import { DomainsService } from '../domains/domains.service'
import { Profile, ACM_ACTIVATION } from '../profiles/profiles.constants'
import { Domain } from '../../models/models'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DownloadRpcService } from './download-rpc.service'
import {
  AuthMode,
  AuthModes,
  PackageRequest,
  RpcAsset,
  RpcCommand,
  RpcCommands,
  RpcRelease,
  detectOS
} from './download-rpc.constants'

@Component({
  selector: 'app-download-rpc',
  templateUrl: './download-rpc.component.html',
  styleUrl: './download-rpc.component.scss',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatRadioGroup,
    MatRadioButton,
    MatButton,
    MatProgressBar,
    TranslateModule
  ],
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }]
})
export class DownloadRpcComponent implements OnInit {
  private readonly fb = inject(FormBuilder)
  private readonly downloadService = inject(DownloadRpcService)
  private readonly profilesService = inject(ProfilesService)
  private readonly domainsService = inject(DomainsService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)

  public readonly commands = RpcCommands
  public readonly authMethods = AuthModes

  public releases: RpcRelease[] = []
  public profiles: Profile[] = []
  public domains: Domain[] = []
  public availableAssets: RpcAsset[] = []
  public isAcmSelected = false
  public isLoading = signal(false)

  public form: FormGroup = this.fb.group({
    command: ['activate' as RpcCommand, Validators.required],
    version: ['', Validators.required],
    os: ['', Validators.required],
    arch: ['', Validators.required],
    authMode: ['token' as AuthMode, Validators.required],
    username: [''],
    password: [''],
    profile: [''],
    domain: ['']
  })

  ngOnInit(): void {
    this.downloadService.getVersions().subscribe({
      next: (releases) => {
        this.releases = releases
      },
      error: () => this.showError('downloadRpc.failVersions.value')
    })
    this.profilesService.getData().subscribe({
      next: (res) => {
        this.profiles = res.data
      },
      error: () => this.showError('downloadRpc.failProfiles.value')
    })
    this.domainsService.getData().subscribe({
      next: (res) => {
        this.domains = res.data
      },
      error: () => this.showError('downloadRpc.failDomains.value')
    })
    this.onProfileOrCommandChange()
  }

  onVersionChange(): void {
    const version = this.form.get('version')?.value
    const release = this.releases.find((r) => r.version === version)
    this.availableAssets = release ? release.assets : []
    const detected = detectOS()
    const match = this.availableAssets.find((a) => a.os === detected) ?? this.availableAssets[0]
    if (match) {
      this.form.get('os')?.setValue(match.os)
      this.form.get('arch')?.setValue(match.arch)
    }
  }

  onAuthModeChange(): void {
    const userpass = this.form.get('authMode')?.value === 'userpass'
    const username = this.form.get('username')
    const password = this.form.get('password')
    if (userpass) {
      username?.setValidators([Validators.required])
      password?.setValidators([Validators.required])
    } else {
      username?.clearValidators()
      password?.clearValidators()
    }
    username?.updateValueAndValidity()
    password?.updateValueAndValidity()
  }

  onProfileOrCommandChange(): void {
    const isActivate = this.form.get('command')?.value === 'activate'
    const profileCtrl = this.form.get('profile')
    const domainCtrl = this.form.get('domain')

    if (isActivate) {
      profileCtrl?.setValidators([Validators.required])
    } else {
      profileCtrl?.clearValidators()
    }

    this.isAcmSelected = this.isAcmProfile()

    if (this.isAcmSelected) {
      domainCtrl?.setValidators([Validators.required])
    } else {
      domainCtrl?.clearValidators()
    }
    profileCtrl?.updateValueAndValidity()
    domainCtrl?.updateValueAndValidity()
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return
    }
    const v = this.form.value
    const request: PackageRequest = {
      command: v.command,
      version: v.version,
      os: v.os,
      arch: v.arch,
      auth:
        v.authMode === 'userpass'
          ? { mode: 'userpass', username: v.username, password: v.password }
          : { mode: 'token' }
    }
    if (v.command === 'activate') {
      request.profile = v.profile
      if (this.isAcmProfile()) {
        request.domain = v.domain
      }
    }

    this.isLoading.set(true)
    this.downloadService
      .buildPackage(request)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (blob) => {
          this.saveBlob(blob, `rpc-${request.command}-${request.os}-${request.arch}.zip`)
          this.snackBar.open(
            this.translate.instant('downloadRpc.success.value'),
            undefined,
            SnackbarDefaults.defaultSuccess
          )
        },
        error: () => this.showError('downloadRpc.failPackage.value')
      })
  }

  private isAcmProfile(): boolean {
    const isActivate = this.form.get('command')?.value === 'activate'
    const selected = this.profiles.find((p) => p.profileName === this.form.get('profile')?.value)
    return isActivate && selected?.activation === ACM_ACTIVATION
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  private showError(key: string): void {
    this.snackBar.open(this.translate.instant(key), undefined, SnackbarDefaults.defaultError)
  }
}
