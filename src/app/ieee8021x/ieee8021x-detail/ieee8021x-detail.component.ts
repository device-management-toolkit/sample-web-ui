/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { IEEE8021xService } from '../ieee8021x.service'
import { AuthenticationProtocols, Config } from '../ieee8021x.constants'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-ieee8021x-detail',
  templateUrl: './ieee8021x-detail.component.html',
  styleUrls: ['./ieee8021x-detail.component.scss']
})
export class IEEE8021xDetailComponent implements OnInit {
  ieee8021xForm: FormGroup
  pageTitle = 'New IEEE8021x Config'
  isLoading: boolean = false
  isEdit: boolean = false
  errorMessages: any[] = []
  protocols = AuthenticationProtocols.toArray()
  profileNameMaxLen = 32
  pxeTimeoutMin = 0 // disables timeout
  pxeTimeoutMax = (60 * 60 * 24) // one day
  pxeTimeoutDefault = (60 * 2) // two mninutes

  constructor (
    public snackBar: MatSnackBar,
    public fb: FormBuilder,
    private readonly activeRoute: ActivatedRoute,
    public router: Router,
    public ieee8021xService: IEEE8021xService) {
    this.ieee8021xForm = fb.group({
      profileName: [
        null,
        [Validators.required, Validators.maxLength(this.profileNameMaxLen), Validators.pattern('[a-zA-Z0-9]*')]
      ],
      authenticationProtocol: [null, Validators.required],
      pxeTimeout: [
        this.pxeTimeoutDefault,
        [Validators.required, Validators.min(this.pxeTimeoutMin), Validators.max(this.pxeTimeoutMax)]
      ],
      wiredInterface: [true, [Validators.required]],
      version: [null]
    })
  }

  ngOnInit (): void {
    this.activeRoute.params.subscribe((params) => {
      this.isLoading = true
      if (params.name) {
        this.isEdit = true
        this.ieee8021xService
          .getRecord(params.name)
          .pipe(finalize(() => { this.isLoading = false }))
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
      } else {
        this.ieee8021xService
          .getCountByInterface()
          .pipe(finalize(() => { this.isLoading = false }))
          .subscribe({
            complete: () => {
              this.onCountByInterfaceComplete()
            }
          })
      }
    })
  }

  // only called when creating a new profile
  onCountByInterfaceComplete (): void {
    // 8021x-wired-and-wireless
    // if (this.ieee8021xService.wiredConfigExists && this.ieee8021xService.wirelessConfigExists) {
    //   this.snackBar.open(
    //     $localize`Only 1 wired and 1 wireless profile are allowed`,
    //     undefined,
    //     SnackbarDefaults.defaultError)
    //   void this.router.navigate(['/ieee8021x'])
    // } else if (this.ieee8021xService.wiredConfigExists || this.ieee8021xService.wirelessConfigExists) {
    //   // 'toggle' the wiredInteface value to the opposite
    //   this.ieee8021xForm.controls.wiredInterface.setValue(!this.ieee8021xService.wiredConfigExists)
    //   this.ieee8021xForm.controls.wiredInterface.disable()
    //   // TODO: adjust pxeTimeout if wireless
    // }

    if (this.ieee8021xService.wiredConfigExists) {
      this.snackBar.open(
        $localize`Only 1 wired profile is allowed`,
        undefined,
        SnackbarDefaults.defaultError)
      void this.router.navigate(['/ieee8021x'])
    }
  }

  getInterfaceLabel (): string {
    return this.ieee8021xForm.controls.wiredInterface.value ? 'Wired' : 'Wireless'
  }

  onSubmit (): void {
    if (this.ieee8021xForm.valid) {
      this.errorMessages = []
      this.isLoading = true
      const result: any = Object.assign({}, this.ieee8021xForm.getRawValue())
      let request: Observable<Config>
      let reqType: string
      if (this.isEdit) {
        request = this.ieee8021xService.update(result)
        reqType = 'updated'
      } else {
        request = this.ieee8021xService.create(result)
        reqType = 'created'
      }
      request
        .pipe(finalize(() => { this.isLoading = false }))
        .subscribe({
          complete: () => {
            this.snackBar.open($localize`Profile ${reqType} successfully`, undefined, SnackbarDefaults.defaultSuccess)
            void this.router.navigate(['/ieee8021x'])
          },
          error: error => {
            this.snackBar.open($localize`Error creating/updating ieee8021x profile`, undefined, SnackbarDefaults.defaultError)
            this.errorMessages = error
          }
        })
    }
  }

  async cancel (): Promise<void> {
    await this.router.navigate(['/ieee8021x'])
  }
}
