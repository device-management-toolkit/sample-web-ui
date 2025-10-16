/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { catchError, finalize, of } from 'rxjs'
import { ProxyConfig } from 'src/models/models'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { ProxyConfigsService } from '../proxy-configs.service'
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
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
  public readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)
  public readonly snackBar = inject(MatSnackBar)
  private readonly proxyConfigsService = inject(ProxyConfigsService)

  public isLoading = signal(false)
  public isEdit = false
  public pageTitle = ''
  public errorMessages: string[] = []

  private originalName = ''

  public proxyConfigForm = this.fb.group({
    name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    port: [8080, [
        Validators.required,
        Validators.min(0),
        Validators.max(65535)
      ]],
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

  onSubmit(): void {
    if (this.proxyConfigForm.valid) {
      this.isLoading.set(true)
      this.errorMessages = []

      const formValue = this.proxyConfigForm.getRawValue()
      const config: ProxyConfig = formValue as ProxyConfig

      const operation$ = this.isEdit ? this.proxyConfigsService.update(config) : this.proxyConfigsService.create(config)

      operation$
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe({
          next: () => {
            this.snackBar.open($localize`Profile saved successfully`, undefined, SnackbarDefaults.defaultSuccess)
            void this.router.navigate(['/proxy-configs'])
          },
          error: (err) => {
            this.snackBar.open($localize`Error saving proxy profile`, undefined, SnackbarDefaults.defaultError)
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
    return ''
  }
}
