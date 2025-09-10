/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { catchError, finalize, of } from 'rxjs'
import { ProxyConfig } from 'src/models/models'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { ProxyConfigsService } from '../proxy-configs.service'
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { MatOption, MatSelect } from '@angular/material/select'
import { MatButton } from '@angular/material/button'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatList, MatListItem } from '@angular/material/list'
import { MatIcon } from '@angular/material/icon'

@Component({
  selector: 'app-proxy-config-detail',
  templateUrl: './proxy-config-detail.component.html',
  styleUrl: './proxy-config-detail.component.scss',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
    MatButton,
    MatProgressBar,
    MatList,
    MatListItem,
    MatIcon,
    TranslateModule
  ]
})
export class ProxyConfigDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  private readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)
  private readonly proxyConfigsService = inject(ProxyConfigsService)

  public isLoading = signal(false)
  public isEdit = false
  public pageTitle = ''
  public errorMessages: string[] = []
  public addressFormats = [
    { value: 3, label: 'IPv4' },
    { value: 4, label: 'IPv6' },
    { value: 201, label: 'FQDN' }
  ]

  private originalName = ''

  public proxyConfigForm = this.fb.group({
    name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    infoFormat: [3, [Validators.required]],
    port: [8080, [Validators.required, Validators.min(0), Validators.max(65535)]],
    networkDnsSuffix: ['', [Validators.required, Validators.maxLength(192)]]
  })

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['name'] && params['name'] !== 'new') {
        this.isEdit = true
        this.originalName = decodeURIComponent(params['name'])
        this.pageTitle = 'proxyConfigs.pageTitle.editProxy.value'
        this.loadProxyConfig(this.originalName)
        this.proxyConfigForm.controls.name.disable()
      } else {
        this.pageTitle = 'proxyConfigs.pageTitle.newProxy.value'
      }
    })

    this.proxyConfigForm.controls.infoFormat.valueChanges.subscribe((value) => {
      this.updateAddressValidation(value!)
    })
  }

  loadProxyConfig(name: string): void {
    this.isLoading.set(true)
    this.proxyConfigsService
      .getRecord(name)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        }),
        catchError(() => {
          void this.cancel()
          return of(null)
        })
      )
      .subscribe({
        next: (config) => {
          if (config) {
            this.proxyConfigForm.patchValue(config)
          }
        }
      })
  }

  updateAddressValidation(format: number): void {
    const addressControl = this.proxyConfigForm.controls.address
    addressControl.clearValidators()

    const ipv4Pattern = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/
    const ipv6Pattern = /^((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*::((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*|((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4})){7}$/
    const fqdnPattern = /^(?=.{1,254}$)((?=[a-z0-9-]{1,63}\.)(xn--+)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}$/

    switch (format) {
      case 3:
        addressControl.setValidators([Validators.required, Validators.pattern(ipv4Pattern)])
        break
      case 4:
        addressControl.setValidators([Validators.required, Validators.pattern(ipv6Pattern)])
        break
      case 201:
        addressControl.setValidators([Validators.required, Validators.pattern(fqdnPattern)])
        break
    }

    addressControl.updateValueAndValidity()
  }

  onSubmit(): void {
    if (this.proxyConfigForm.valid) {
      this.isLoading.set(true)
      this.errorMessages = []

      const formValue = this.proxyConfigForm.getRawValue()
      const config: ProxyConfig = formValue as ProxyConfig

      const operation$ = this.isEdit
        ? this.proxyConfigsService.update(config)
        : this.proxyConfigsService.create(config)

      operation$
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe({
          next: () => {
            const message = this.isEdit
              ? this.translate.instant('proxyConfigs.messages.updatedSuccess')
              : this.translate.instant('proxyConfigs.messages.createdSuccess')

            this.snackBar.open(message, undefined, SnackbarDefaults.defaultSuccess)
            void this.router.navigate(['/proxy-configs'])
          },
          error: (err) => {
            if (err?.error?.errors) {
              this.errorMessages = err.error.errors.map((error: any) => error.msg)
            } else {
              this.errorMessages = [err?.error?.message || 'An error occurred']
            }
          }
        })
    }
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/proxy-configs'])
  }

  getaddressError(): string {
    const control = this.proxyConfigForm.controls.address
    if (control.hasError('required')) {
      return 'Server address is required'
    }
    if (control.hasError('pattern')) {
      const format = this.proxyConfigForm.controls.infoFormat.value
      switch (format) {
        case 3:
          return 'Please enter a valid IPv4 address'
        case 4:
          return 'Please enter a valid IPv6 address'
        case 201:
          return 'Please enter a valid FQDN'
      }
    }
    return ''
  }
}
