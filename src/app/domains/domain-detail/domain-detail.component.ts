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
import { DomainsService } from '../domains.service'
import { Domain } from 'src/models/models'
import { MatTooltip } from '@angular/material/tooltip'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatError, MatHint, MatSuffix } from '@angular/material/form-field'
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

@Component({
  selector: 'app-domain-detail',
  templateUrl: './domain-detail.component.html',
  styleUrls: ['./domain-detail.component.scss'],
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
    MatButton,
    MatIconButton,
    MatSuffix,
    MatTooltip,
    MatCardActions,
    MatListItemIcon,
    MatListItemTitle,
    TranslateModule
  ]
})
export class DomainDetailComponent implements OnInit {
  // Dependency Injection
  private readonly activeRoute = inject(ActivatedRoute)
  private readonly domainsService = inject(DomainsService)
  private readonly fb = inject(FormBuilder)
  private readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)
  public readonly router = inject(Router)

  public domainForm = this.fb.nonNullable.group({
    profileName: ['', Validators.required],
    domainSuffix: ['', Validators.required],
    provisioningCert: ['', Validators.required],
    provisioningCertPassword: ['', Validators.required],
    version: ['']
  })
  public isLoading = signal(false)
  public isCertificateUploaded = signal(false)
  public isEdit = false
  public certPassInputType = 'password'
  public pageTitle: string
  public errorMessages: string[] = []

  constructor() {
    this.pageTitle = this.translate.instant('domains.header.domainsNewTitle.value')
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      // hmm -- this would actually prevent editing of a domain called new
      if (params.name != null && params.name !== '') {
        this.isLoading.set(true)
        this.domainsService
          .getRecord(params.name as string)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: (data) => {
              this.isEdit = true
              this.domainForm.controls.profileName.disable()
              this.pageTitle = data.profileName
              this.domainForm.patchValue(data)
              this.isCertificateUploaded.set(!!data.provisioningCert)
            },
            error: (err) => {
              this.errorMessages = err
            }
          })
      }
    })
  }

  onSubmit(): void {
    const result: Domain = Object.assign({}, this.domainForm.getRawValue()) as any
    result.provisioningCertStorageFormat = 'string'
    if (this.domainForm.valid) {
      this.isLoading.set(true)
      let request
      if (this.isEdit) {
        request = this.domainsService.update(result)
      } else {
        request = this.domainsService.create(result)
      }
      request
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe({
          next: () => {
            const completeMessage: string = this.translate.instant('domainDetail.completeProfile.value')
            this.snackBar.open(completeMessage, undefined, SnackbarDefaults.defaultSuccess)

            this.router.navigate(['/domains'])
          },
          error: (err) => {
            const errorMessage: string = this.translate.instant('domainDetail.errorDeleteConfiguration.value')
            this.snackBar.open(errorMessage, undefined, SnackbarDefaults.defaultError)

            this.errorMessages = err.map((errorMessage: string) => this.translate.instant(errorMessage))
          }
        })
    }
  }

  onFileSelected(e: Event): void {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader()

      reader.onload = (e2: ProgressEvent<FileReader>) => {
        const base64: string = e2.target?.result as string
        // remove prefix of "data:application/x-pkcs12;base64," returned by "readAsDataURL()"
        const index: number = base64.indexOf('base64,')
        const cert = base64.substring(index + 7, base64.length)
        this.domainForm.patchValue({ provisioningCert: cert })
        this.isCertificateUploaded.set(true)
      }
      if (e.target != null) {
        const target = e.target as HTMLInputElement
        const files = target.files
        if (files != null) {
          reader.readAsDataURL(files[0])
        }
      }
    }
  }

  toggleCertPassVisibility(): void {
    this.certPassInputType = this.certPassInputType === 'password' ? 'text' : 'password'
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/domains'])
  }
}
