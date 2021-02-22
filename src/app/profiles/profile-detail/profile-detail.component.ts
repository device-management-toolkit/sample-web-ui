/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { ConfigsService } from 'src/app/configs/configs.service'
import Constants from 'src/app/shared/config/Constants'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { CIRAConfig } from 'src/models/models'
import { ProfilesService } from '../profiles.service'

@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss']
})
export class ProfileDetailComponent implements OnInit {
  public profileForm: FormGroup
  public activationModes = [{ display: 'Admin Control Mode', value: Constants.ACMActivate }, { display: 'Client Control Mode', value: Constants.CCMActivate }]
  public ciraConfigurations: CIRAConfig[] = []
  public isLoading = false

  constructor (public snackBar: MatSnackBar, public fb: FormBuilder, public router: Router, private readonly activeRoute: ActivatedRoute,
    public profilesService: ProfilesService, private readonly configsService: ConfigsService) {
    this.profileForm = fb.group({
      profileName: [null, Validators.required],
      activation: [this.activationModes[0].value, Validators.required],
      amtPassword: [null, Validators.required],
      generateRandomPassword: [false, Validators.required],
      generateRandomMEBxPassword: [false, Validators.required],
      mebxPasswordLength: [null],
      passwordLength: [null],
      mebxPassword: [null, Validators.required],
      networkConfigName: [null, Validators.required],
      ciraConfigName: [null, Validators.required]
    })
  }

  ngOnInit (): void {
    this.activeRoute.params.subscribe(params => {
      if (params.name != null && params.name !== '') {
        this.isLoading = true
        this.profilesService.getRecord(params.name).pipe(
          catchError(err => {
            // TODO: handle error better
            console.log(err)
            this.snackBar.open($localize`Error retrieving profile`, undefined, SnackbarDefaults.defaultError)
            return of({})
          }), finalize(() => {
            this.isLoading = false
          })).subscribe(data => {
          this.profileForm.patchValue(data)
        })
      }
    })

    this.configsService.getData().pipe(catchError(err => {
      // TODO: handle error better
      console.log(err)
      this.snackBar.open($localize`Error retrieving CIRA configs`, undefined, SnackbarDefaults.defaultError)
      return of([])
    })).subscribe(data => {
      this.ciraConfigurations = data
    })
  }

  async cancel (): Promise<void> {
    await this.router.navigate(['/profiles'])
  }

  onSubmit (): void {
    if (this.profileForm.valid) {
      this.isLoading = true
      const result: any = Object.assign({}, this.profileForm.value)
      this.profilesService.create(result).pipe(
        catchError(err => {
        // TODO: handle error better
          console.log(err)
          this.snackBar.open($localize`Error creating profile`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }), finalize(() => {
          this.isLoading = false
        })).subscribe(data => {
        this.snackBar.open($localize`Profile created successfully`, undefined, SnackbarDefaults.defaultSuccess)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.router.navigate(['/profiles'])
      })
    }
  }
}
