/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, computed } from '@angular/core'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { Observable } from 'rxjs'

import { finalize, mergeMap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { CIRAConfig } from 'src/models/models'
import { ConfigsService } from '../configs.service'
import { MatButton } from '@angular/material/button'
import { MatSlideToggle } from '@angular/material/slide-toggle'
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatError, MatHint, MatSuffix } from '@angular/material/form-field'
import { MatIconButton } from '@angular/material/button'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIcon } from '@angular/material/icon'
import { MatList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list'
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions
} from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatToolbar } from '@angular/material/toolbar'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-config-detail',
  templateUrl: './config-detail.component.html',
  styleUrls: ['./config-detail.component.scss'],
  imports: [
    MatToolbar,
    MatProgressBar,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatList,
    MatListItem,
    MatIcon,
    ReactiveFormsModule,
    MatCardContent,
    MatFormField,
    MatInput,
    MatError,
    MatHint,
    MatSuffix,
    MatRadioGroup,
    MatRadioButton,
    MatSlideToggle,
    MatCardActions,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatListItemIcon,
    MatListItemTitle,
    TranslateModule
  ]
})
export class ConfigDetailComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly fb = inject(FormBuilder)
  private readonly activeRoute = inject(ActivatedRoute)
  private readonly configsService = inject(ConfigsService)
  private readonly translate = inject(TranslateService)
  public readonly router = inject(Router)

  public configForm = this.fb.group({
    configName: ['', Validators.required],
    mpsServerAddress: ['', Validators.required],
    serverAddressFormat: [3, Validators.required], // 3 = ip, 201 = FQDN? wtf?
    commonName: ['', Validators.required],
    mpsPort: [4433, Validators.required],
    username: ['admin', Validators.required],
    password: [null as string | null],
    mpsRootCertificate: [''],
    proxyDetails: [''],
    generateRandomPassword: [true],
    version: [null]
  })
  public isLoading = signal(false)
  public pageTitle: string
  public isEdit = signal(false)
  public errorMessages: string[] = []
  public passwordInputType = signal<'password' | 'text'>('password')
  public isCloud = environment.cloud
  // Computed property to determine if password field should be shown
  public readonly showPasswordField = computed(() => {
    return this.isEdit() && !this.configForm.controls.generateRandomPassword.value
  })

  constructor() {
    this.pageTitle = this.translate.instant('configs.header.ciraNewTitle.value')
  }
  // IP ADDRESS REGEX
  // ^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      if (params.name) {
        this.isLoading.set(true)
        this.configsService
          .getRecord(decodeURIComponent(params.name as string))
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: (data) => {
              this.isEdit.set(true)
              this.pageTitle = data.configName
              this.configForm.controls.configName.disable()
              this.configForm.patchValue(data)
            },
            error: (error) => {
              this.errorMessages = error
            }
          })
      }
    })

    this.configForm.controls.serverAddressFormat?.valueChanges.subscribe((value) => {
      this.serverAddressFormatChange(value!)
    })

    this.configForm.controls.mpsServerAddress?.valueChanges.subscribe((value) => {
      this.serverAddressChange(value ?? '')
    })

    this.configForm.controls.generateRandomPassword?.valueChanges.subscribe((value) => {
      this.generateRandomPasswordChange(value!)
    })
  }

  serverAddressChange(value: string): void {
    if (this.configForm.controls.serverAddressFormat?.value === 3) {
      this.configForm.controls.commonName?.setValue(value)
    }
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/ciraconfigs'])
  }

  serverAddressFormatChange(value: number): void {
    if (value === 3) {
      // ipv4
      this.configForm.controls.commonName?.enable()
    } else {
      // fqdn
      this.configForm.controls.commonName?.disable()
      this.configForm.controls.commonName?.setValue(null)
    }
  }

  generateRandomPasswordChange(value: boolean): void {
    console.log(value)
    if (value) {
      this.configForm.controls.password.disable()
      this.configForm.controls.password.setValue(null)
      this.configForm.controls.password.clearValidators()
    } else {
      this.configForm.controls.password.enable()
      this.configForm.controls.password.setValidators(Validators.required)
    }
    this.configForm.controls.password.updateValueAndValidity()
  }

  togglePasswordVisibility(): void {
    this.passwordInputType.update((current) => (current === 'password' ? 'text' : 'password'))
  }

  trimRootCert = (cert: string): string =>
    cert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').replace(/\s/g, '')

  onSubmit(): void {
    if (this.configForm.valid) {
      this.isLoading.set(true)
      const result: CIRAConfig = Object.assign({}, this.configForm.getRawValue()) as any
      // unsure why this is needed or what it is
      result.authMethod = 2
      // convert to number
      result.serverAddressFormat = +result.serverAddressFormat
      let reqType: string
      let rpsRequest: Observable<CIRAConfig>
      if (this.isEdit()) {
        reqType = 'updated'
        rpsRequest = this.configsService.update(result)
      } else {
        reqType = 'created'
        rpsRequest = this.configsService.create(result)
      }
      this.configsService
        .loadMPSRootCert()
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          }),
          mergeMap((data: string) => {
            result.mpsRootCertificate = this.trimRootCert(data)
            return rpsRequest
          })
        )
        .subscribe({
          next: () => {
            this.snackBar.open(
              this.translate.instant('configs.success.value', { reqType: reqType }),
              undefined,
              SnackbarDefaults.defaultSuccess
            )

            this.router.navigate(['/ciraconfigs'])
          },
          error: (error) => {
            console.error('error', error)
            this.errorMessages = error
          }
        })
    }
  }
}
