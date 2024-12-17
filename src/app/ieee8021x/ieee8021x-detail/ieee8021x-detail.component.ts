/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule
} from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { IEEE8021xService } from '../ieee8021x.service'
import { AuthenticationProtocols } from '../ieee8021x.constants'
import { Observable } from 'rxjs'
import { MatButton } from '@angular/material/button'
import { MatOption } from '@angular/material/core'
import { MatSelect } from '@angular/material/select'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field'
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio'
import { MatIcon } from '@angular/material/icon'
import { MatList, MatListItem } from '@angular/material/list'
import { MatCard, MatCardSubtitle, MatCardContent, MatCardActions } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatToolbar } from '@angular/material/toolbar'
import { FormOption } from 'src/models/models'
import { IEEE8021xConfig } from 'src/models/models'

@Component({
  selector: 'app-ieee8021x-detail',
  templateUrl: './ieee8021x-detail.component.html',
  styleUrls: ['./ieee8021x-detail.component.scss'],
  imports: [
    MatToolbar,
    MatProgressBar,
    MatCard,
    MatList,
    MatListItem,
    MatIcon,
    ReactiveFormsModule,
    MatCardSubtitle,
    MatRadioGroup,
    MatRadioButton,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSelect,
    MatOption,
    MatCardActions,
    MatButton
  ]
})
export class IEEE8021xDetailComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  fb = inject(FormBuilder)
  private readonly activeRoute = inject(ActivatedRoute)
  router = inject(Router)
  ieee8021xService = inject(IEEE8021xService)

  ieee8021xForm: FormGroup
  pageTitle = 'New IEEE8021x Config'
  isLoading = false
  isEdit = false
  authenticationProtocols: FormOption<number>[] = []
  errorMessages: any[] = []
  profileNameMaxLen = 32
  pxeTimeoutMin = 0 // disables timeout
  pxeTimeoutMax = 60 * 60 * 24 // one day
  pxeTimeoutDefault = 60 * 2 // two mninutes

  constructor() {
    const fb = this.fb

    this.ieee8021xForm = fb.group({
      profileName: [
        null,
        [
          Validators.required,
          Validators.maxLength(this.profileNameMaxLen),
          Validators.pattern('[a-zA-Z0-9]*')]
      ],
      authenticationProtocol: [
        null,
        [Validators.required, this.protocolValidator]
      ],
      pxeTimeout: [
        this.pxeTimeoutDefault,
        [
          Validators.required,
          Validators.min(this.pxeTimeoutMin),
          Validators.max(this.pxeTimeoutMax)]
      ],
      wiredInterface: [
        null,
        [Validators.required]
      ],
      version: [null]
    })
    // add custom validation to enforce protcols appropriate to interface type
    // unable to add this protocolValidator in the declaration becuase it causes circular form reference problems
    this.ieee8021xForm.controls.authenticationProtocol.addValidators(this.protocolValidator())
    this.ieee8021xForm.controls.wiredInterface.valueChanges.subscribe((isWired) => {
      if (isWired) {
        this.authenticationProtocols = AuthenticationProtocols.filter((z) => z.mode === 'wired' || z.mode === 'both')
      } else {
        this.authenticationProtocols = AuthenticationProtocols.filter((z) => z.mode === 'both')
      }
      this.ieee8021xForm.controls.authenticationProtocol.updateValueAndValidity()
    })
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      if (params.name) {
        this.isLoading = true
        this.isEdit = true
        this.ieee8021xService
          .getRecord(params.name as string)
          .pipe(
            finalize(() => {
              this.isLoading = false
            })
          )
          .subscribe({
            next: (config) => {
              this.pageTitle = 'IEEE8021x Config'
              this.ieee8021xForm.controls.profileName.disable()
              this.ieee8021xForm.patchValue(config)
              if (config.wiredInterface) {
                this.pxeTimeoutDefault = 0
              }
            }
          })
      }
    })
  }

  protocolValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isValid = this.authenticationProtocols.map((p) => p.value).includes(control.value as number)
      return isValid ? null : { protoclValue: true }
    }
  }

  shouldShowPxeTimeout(): boolean {
    return this.ieee8021xForm.controls.wiredInterface.value
  }

  getInterfaceLabel(): string {
    return this.ieee8021xForm.controls.wiredInterface.value ? 'Wired' : 'Wireless'
  }

  onSubmit(): void {
    if (this.ieee8021xForm.valid) {
      this.errorMessages = []
      this.isLoading = true
      // disable pxeTimeout if not wired
      if (!this.ieee8021xForm.controls.wiredInterface.value) {
        this.ieee8021xForm.controls.pxeTimeout.setValue(this.pxeTimeoutMin)
      }
      const config: IEEE8021xConfig = Object.assign({}, this.ieee8021xForm.getRawValue())
      let request: Observable<IEEE8021xConfig>
      let reqType: string
      if (this.isEdit) {
        request = this.ieee8021xService.update(config)
        reqType = 'updated'
      } else {
        request = this.ieee8021xService.create(config)
        reqType = 'created'
      }
      request
        .pipe(
          finalize(() => {
            this.isLoading = false
          })
        )
        .subscribe({
          complete: () => {
            this.snackBar.open($localize`Profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
            void this.router.navigate(['/ieee8021x'])
          },
          error: (error) => {
            this.snackBar.open(
              $localize`Error creating/updating ieee8021x profile`,
              undefined,
              SnackbarDefaults.defaultError
            )
            this.errorMessages = error
          }
        })
    }
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/ieee8021x'])
  }
}
