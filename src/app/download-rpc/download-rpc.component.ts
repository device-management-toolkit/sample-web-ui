/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule
} from '@angular/forms'
import { MatButton } from '@angular/material/button'
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle
} from '@angular/material/card'
import { MatFormField, MatLabel, MatError, MatHint, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { MatOption } from '@angular/material/core'
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio'
import { MatChip } from '@angular/material/chips'
import { MatIcon } from '@angular/material/icon'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { finalize } from 'rxjs/operators'
import { ProfilesService } from '../profiles/profiles.service'
import { DomainsService } from '../domains/domains.service'
import { Profile, ACM_ACTIVATION } from '../profiles/profiles.constants'
import { Domain, FormOption, PackageRequest, RpcAuthMode, RpcCommand, RpcRelease } from '../../models/models'
import { environment } from '../../environments/environment'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DownloadRpcService } from './download-rpc.service'
import { AuthModes, OsOptions, RpcArch, RpcCommands, TokenLifetimes } from './download-rpc.constants'

@Component({
  selector: 'app-download-rpc',
  templateUrl: './download-rpc.component.html',
  styleUrl: './download-rpc.component.scss',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardActions,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatError,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    MatRadioGroup,
    MatRadioButton,
    MatButton,
    MatChip,
    MatIcon,
    MatProgressBar,
    TranslatePipe
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
  public readonly tokenLifetimes = TokenLifetimes
  public readonly REQUIRED_ERROR_KEY = 'fieldRequired.short.value'

  public releases = signal<RpcRelease[]>([])
  public profiles = signal<Profile[]>([])
  public domains = signal<Domain[]>([])
  public availableOses = signal<FormOption<string>[]>([])
  public isAcmSelected = signal(false)
  public isLoading = signal(false)

  public form: FormGroup = this.fb.group({
    serverUrl: [this.defaultServerUrl(), [Validators.required, this.serverUrlValidator()]],
    command: ['activate' as RpcCommand, Validators.required],
    version: ['', Validators.required],
    os: ['', Validators.required],
    authMode: ['none' as RpcAuthMode, Validators.required],
    tokenTtl: ['1h', Validators.required],
    profile: [''],
    domain: ['']
  })

  private readonly serverUrl = toSignal(this.form.controls['serverUrl'].valueChanges, {
    initialValue: this.form.controls['serverUrl'].value
  })

  // rpc-go runs on the AMT device, so a loopback server URL only works when Console shares that machine.
  public isLoopbackServerUrl = computed(() => {
    let host: string
    try {
      host = new URL(String(this.serverUrl() ?? '').trim()).hostname.toLowerCase()
    } catch {
      return false
    }
    return host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host.startsWith('127.')
  })

  ngOnInit(): void {
    this.downloadService.getVersions().subscribe({
      next: (releases) => {
        this.releases.set(releases)
        this.form.get('version')?.setValue(releases[0]?.version ?? '')
        this.onVersionChange()
      },
      error: () => this.showError('downloadRpc.failVersions.value')
    })
    this.profilesService.getData().subscribe({
      next: (res) => {
        this.profiles.set(res.data)
        this.form.get('profile')?.setValue(res.data[0]?.profileName ?? '')
        this.onProfileOrCommandChange()
      },
      error: () => this.showError('downloadRpc.failProfiles.value')
    })
    this.domainsService.getData().subscribe({
      next: (res) => {
        this.domains.set(res.data)
      },
      error: () => this.showError('downloadRpc.failDomains.value')
    })
    this.onProfileOrCommandChange()
  }

  onVersionChange(): void {
    const version = this.form.get('version')?.value
    const assets = this.releases().find((r) => r.version === version)?.assets ?? []
    const hasBuild = (os: string): boolean => assets.some((a) => a.os === os && a.arch === RpcArch)
    const oses = OsOptions.filter((o) =>
      o.value === 'both' ? hasBuild('windows') && hasBuild('linux') : hasBuild(o.value)
    )
    this.availableOses.set(oses)
    this.form.get('os')?.setValue(oses[0]?.value ?? '')
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

    this.isAcmSelected.set(this.isAcmProfile())

    if (this.isAcmSelected()) {
      domainCtrl?.setValidators([Validators.required])
    } else {
      domainCtrl?.clearValidators()
    }
    profileCtrl?.updateValueAndValidity()
    domainCtrl?.updateValueAndValidity()
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      return
    }
    const v = this.form.value
    const request: PackageRequest = {
      command: v.command,
      version: v.version,
      os: v.os,
      arch: RpcArch,
      serverUrl: String(v.serverUrl).trim(),
      auth: { mode: v.authMode }
    }
    if (v.authMode === 'token') {
      request.tokenTtl = v.tokenTtl
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
          this.saveBlob(blob, `rpc-${request.command}-${request.os}.zip`)
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
    const selected = this.profiles().find((p) => p.profileName === this.form.get('profile')?.value)
    return isActivate && selected?.activation === ACM_ACTIVATION
  }

  // Empty values pass so that Validators.required owns the empty case.
  private serverUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '').trim()
      if (value === '') {
        return null
      }
      let parsed: URL
      try {
        parsed = new URL(value)
      } catch {
        return { serverUrl: true }
      }
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? null : { serverUrl: true }
    }
  }

  // Pre-fills the server URL with the Console API base the UI itself talks to.
  private defaultServerUrl(): string {
    const configured = (environment.rpsServer ?? '').trim()
    if (configured === '') {
      return window.location.origin
    }
    try {
      const url = new URL(configured, window.location.origin)
      return `${url.origin}${url.pathname}`.replace(/\/+$/, '')
    } catch {
      return window.location.origin
    }
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
