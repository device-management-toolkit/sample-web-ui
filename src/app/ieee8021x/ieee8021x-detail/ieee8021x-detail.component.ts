/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import {
  AbstractControl,
  FormBuilder,
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
import { MatList, MatListItem, MatListItemIcon, MatListItemTitle } from '@angular/material/list'
import { MatCard, MatCardSubtitle, MatCardContent, MatCardActions } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatToolbar } from '@angular/material/toolbar'
import { FormOption } from 'src/models/models'
import { IEEE8021xConfig } from 'src/models/models'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

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
    MatButton,
    MatListItemIcon,
    MatListItemTitle,
    TranslateModule
  ]
})
export class IEEE8021xDetailComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly fb = inject(FormBuilder)
  private readonly activeRoute = inject(ActivatedRoute)
  private readonly ieee8021xService = inject(IEEE8021xService)
  private readonly translate = inject(TranslateService)
  public readonly router = inject(Router)

  public readonly profileNameMaxLen = 32
  public readonly pxeTimeoutMin = 0 // disables timeout
  public readonly pxeTimeoutMax = 60 * 60 * 24 // one day
  public ieee8021xForm = this.fb.nonNullable.group({
    profileName: [
      '',
      [
        Validators.required,
        Validators.maxLength(this.profileNameMaxLen),
        Validators.pattern('[a-zA-Z0-9]*')
      ]
    ],
    authenticationProtocol: [
      0,
      [Validators.required, this.protocolValidator]
    ],
    pxeTimeout: [
      120,
      [
        Validators.required,
        Validators.min(this.pxeTimeoutMin),
        Validators.max(this.pxeTimeoutMax)
      ]
    ],
    wiredInterface: [
      true,
      [Validators.required]
    ],
    version: ['']
  })
  public pageTitle: string
  public authenticationProtocols: FormOption<number>[] = AuthenticationProtocols.filter(
    (z) => z.mode === 'wired' || z.mode === 'both'
  )
  public errorMessages: any[] = []

  public isLoading = signal(false)
  public isEdit = false

  constructor() {
    // add custom validation to enforce protocols appropriate to interface type
    // unable to add this protocolValidator in the declaration because it causes circular form reference problems
    this.ieee8021xForm.controls.authenticationProtocol.addValidators(this.protocolValidator())
    this.ieee8021xForm.controls.wiredInterface.valueChanges.subscribe((isWired) => {
      if (isWired) {
        this.authenticationProtocols = AuthenticationProtocols.filter((z) => z.mode === 'wired' || z.mode === 'both')
      } else {
        this.authenticationProtocols = AuthenticationProtocols.filter((z) => z.mode === 'both')
      }
      this.ieee8021xForm.controls.authenticationProtocol.updateValueAndValidity()
    })
    this.pageTitle = this.translate.instant('ieee8021xConfigs.header.ieee8021NewTitle.value')
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      if (params.name) {
        this.isLoading.set(true)
        this.isEdit = true
        this.ieee8021xService
          .getRecord(params.name as string)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: (config) => {
              this.pageTitle = config.profileName
              this.ieee8021xForm.controls.profileName.disable()
              this.ieee8021xForm.patchValue(config)
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
    return this.ieee8021xForm.controls.wiredInterface.value
      ? this.translate.instant('common.wired.value')
      : this.translate.instant('common.wireless.value')
  }

  onSubmit(): void {
    if (this.ieee8021xForm.valid) {
      this.errorMessages = []
      this.isLoading.set(true)
      // disable pxeTimeout if not wired
      if (!this.ieee8021xForm.controls.wiredInterface.value) {
        this.ieee8021xForm.controls.pxeTimeout.setValue(this.pxeTimeoutMin)
      }
      const config: IEEE8021xConfig = Object.assign({}, this.ieee8021xForm.getRawValue())
      let request: Observable<IEEE8021xConfig>
      if (this.isEdit) {
        request = this.ieee8021xService.update(config)
      } else {
        request = this.ieee8021xService.create(config)
      }
      request
        .pipe(
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe({
          complete: () => {
            const completeMessage: string = this.translate.instant('common.completeProfile.value')
            this.snackBar.open(completeMessage, undefined, SnackbarDefaults.defaultSuccess)
            void this.router.navigate(['/ieee8021x'])
          },
          error: (error) => {
            const errorMessage: string = this.translate.instant('ieee.errorCreateUpdate.value')
            this.snackBar.open(errorMessage, undefined, SnackbarDefaults.defaultError)
            this.errorMessages = error
          }
        })
    }
  }

  async cancel(): Promise<void> {
    await this.router.navigate(['/ieee8021x'])
  }
}
