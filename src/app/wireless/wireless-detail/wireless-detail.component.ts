/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { WirelessService } from '../wireless.service'
import { IEEE8021xService } from '../../ieee8021x/ieee8021x.service'
import { AuthenticationMethods, EncryptionMethods } from '../wireless.constants'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton, MatButton } from '@angular/material/button'
import { MatOption } from '@angular/material/core'
import { MatSelect } from '@angular/material/select'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel, MatError, MatHint, MatSuffix } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list'
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card'
import { MatToolbar } from '@angular/material/toolbar'
import { WirelessConfig } from 'src/models/models'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { MatProgressBar } from '@angular/material/progress-bar'

@Component({
  selector: 'app-wireless-detail',
  templateUrl: './wireless-detail.component.html',
  styleUrls: ['./wireless-detail.component.scss'],
  imports: [
    MatToolbar,
    MatCard,
    MatList,
    MatListItem,
    MatIcon,
    ReactiveFormsModule,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatHint,
    MatSelect,
    MatOption,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatCardActions,
    MatButton,
    MatListItemIcon,
    MatListItemTitle,
    MatProgressBar,
    TranslateModule
  ]
})
export class WirelessDetailComponent implements OnInit {
  // Dependency Injection
  private translate = inject(TranslateService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly fb = inject(FormBuilder)
  private readonly activeRoute = inject(ActivatedRoute)
  private readonly wirelessService = inject(WirelessService)
  private readonly ieee8021xService = inject(IEEE8021xService)
  public readonly router = inject(Router)

  public wirelessForm = this.fb.group({
    profileName: ['', [Validators.required]],
    authenticationMethod: [
      4,
      Validators.required
    ],
    encryptionMethod: [3, Validators.required],
    ssid: ['', Validators.required],
    pskPassphrase: ['', [Validators.minLength(8), Validators.maxLength(32)]],
    ieee8021xProfileName: [undefined],
    version: ['']
  })
  public pageTitle: string
  public pskInputType = 'password'
  public authenticationMethods = AuthenticationMethods.filter((m) => m.mode === 'PSK')
  public encryptionModes = EncryptionMethods
  public iee8021xConfigNames: Set<string> = new Set<string>()
  public showPSKPassPhrase = true
  public showIEEE8021x = false
  public isEdit = false
  public errorMessages: any[] = []
  public isLoading = signal(false)

  constructor() {
    this.pageTitle = this.translate.instant('wirelessDetail.newWirelessConfig.value')
    this.wirelessForm.controls.authenticationMethod.valueChanges.subscribe((value) => {
      this.onAuthenticationMethodChange(value!)
    })
  }

  ngOnInit(): void {
    this.getIEEE8021xConfigs()
    this.activeRoute.params.subscribe((params) => {
      if (params.name != null && params.name !== '') {
        this.wirelessService
          .getRecord(params.name as string)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe((config) => {
            this.isEdit = true
            this.pageTitle = config.profileName
            this.wirelessForm.controls.profileName.disable()
            this.wirelessForm.patchValue(config as any)
            if (config.ieee8021xProfileName) {
              this.add8021xConfigurations([config.ieee8021xProfileName])
            }
          })
      }
    })
  }

  onSubmit(): void {
    if (this.wirelessForm.valid) {
      this.isLoading.set(true)
      const result = Object.assign({}, this.wirelessForm.getRawValue()) as WirelessConfig

      const request = this.isEdit ? this.wirelessService.update(result) : this.wirelessService.create(result)

      request
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe({
          next: () => {
            const completedMessage: string = this.translate.instant('wirelessDetail.saving.value')

            this.snackBar.open(completedMessage, undefined, SnackbarDefaults.defaultSuccess)
            void this.router.navigate(['/wireless'])
          },
          error: (err) => {
            const errorMessage: string = this.translate.instant('wirelessDetail.errorSaving.value')
            this.snackBar.open(errorMessage, undefined, SnackbarDefaults.defaultError)
            this.errorMessages = err
          }
        })
    }
  }

  getIEEE8021xConfigs(): void {
    this.ieee8021xService.getData().subscribe({
      next: (ieeeConfigs) => {
        const cfgNames = ieeeConfigs.data.filter((c) => !c.wiredInterface).map((c) => c.profileName)
        if (cfgNames.length > 0) {
          this.add8021xConfigurations(cfgNames)
        }
      },
      error: (err) => {
        this.errorMessages = err
      }
    })
  }

  add8021xConfigurations(names: string[]): void {
    this.authenticationMethods = AuthenticationMethods
    const sorted = [...this.iee8021xConfigNames, ...names].sort()
    this.iee8021xConfigNames = new Set(sorted)
  }

  onAuthenticationMethodChange(value: number): void {
    const controls = this.wirelessForm.controls
    this.showPSKPassPhrase = value === 4 || value === 6
    if (this.showPSKPassPhrase) {
      controls.pskPassphrase.addValidators(Validators.required)
    } else {
      controls.pskPassphrase.setValue(null)
      controls.pskPassphrase.removeValidators(Validators.required)
    }
    controls.pskPassphrase.updateValueAndValidity()
    this.showIEEE8021x = value === 5 || value === 7
    if (this.showIEEE8021x) {
      controls.ieee8021xProfileName.addValidators(Validators.required)
    } else {
      controls.ieee8021xProfileName.setValue(null)
      controls.ieee8021xProfileName.removeValidators(Validators.required)
    }
    controls.ieee8021xProfileName.updateValueAndValidity()
  }

  togglePSKPassVisibility(): void {
    this.pskInputType = this.pskInputType === 'password' ? 'text' : 'password'
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/wireless'])
  }
}
