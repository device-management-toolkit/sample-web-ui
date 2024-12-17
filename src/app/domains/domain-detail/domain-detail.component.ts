/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
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
import { MatList, MatListItem } from '@angular/material/list'
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
    MatCardActions
  ]
})
export class DomainDetailComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  fb = inject(FormBuilder)
  private readonly activeRoute = inject(ActivatedRoute)
  router = inject(Router)
  domainsService = inject(DomainsService)

  public domainForm: FormGroup
  public isLoading = false
  public pageTitle = 'New Domain'
  public isEdit = false
  public certPassInputType = 'password'
  public errorMessages: string[] = []
  constructor() {
    const fb = this.fb

    this.domainForm = fb.group({
      profileName: [null, Validators.required],
      domainSuffix: [null, Validators.required],
      provisioningCert: [null, Validators.required],
      provisioningCertPassword: [null, Validators.required],
      version: [null]
    })
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      // hmm -- this would actually prevent editing of a domain called new
      if (params.name != null && params.name !== '') {
        this.isLoading = true
        this.domainsService
          .getRecord(params.name as string)
          .pipe(
            finalize(() => {
              this.isLoading = false
            })
          )
          .subscribe({
            next: (data) => {
              this.isEdit = true
              this.domainForm.controls.profileName.disable()
              this.pageTitle = data.profileName
              this.domainForm.patchValue(data)
            },
            error: (err) => {
              this.errorMessages = err
            }
          })
      }
    })
  }

  onSubmit(): void {
    const result: Domain = Object.assign({}, this.domainForm.getRawValue())
    result.provisioningCertStorageFormat = 'string'
    if (this.domainForm.valid) {
      this.isLoading = true
      let request
      let reqType: string
      if (this.isEdit) {
        request = this.domainsService.update(result)
        reqType = 'updated'
      } else {
        request = this.domainsService.create(result)
        reqType = 'created'
      }
      request
        .pipe(
          finalize(() => {
            this.isLoading = false
          })
        )
        .subscribe({
          next: (data) => {
            this.snackBar.open(
              $localize`Domain profile ${reqType} successfully`,
              undefined,
              SnackbarDefaults.defaultSuccess
            )

            this.router.navigate(['/domains'])
          },
          error: (err) => {
            this.snackBar.open(
              $localize`Error creating/updating domain profile`,
              undefined,
              SnackbarDefaults.defaultError
            )
            this.errorMessages = err
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
