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
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { MatChipInputEvent } from '@angular/material/chips'

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
  public pageTitle = 'New Profile'
  public isEdit = false
  public tags: string[] = []
  readonly separatorKeysCodes: number[] = [ENTER, COMMA]

  constructor (public snackBar: MatSnackBar, public fb: FormBuilder, public router: Router, private readonly activeRoute: ActivatedRoute,
    public profilesService: ProfilesService, private readonly configsService: ConfigsService) {
    this.profileForm = fb.group({
      profileName: [null, Validators.required],
      activation: [this.activationModes[0].value, Validators.required],
      amtPassword: [null, Validators.required],
      generateRandomPassword: [false, Validators.required],
      generateRandomMEBxPassword: [false, Validators.required],
      mebxPasswordLength: [{ value: null, disabled: true }, [Validators.max(32), Validators.min(8)]],
      passwordLength: [{ value: null, disabled: true }, [Validators.max(32), Validators.min(8)]],
      mebxPassword: [null, Validators.required],
      networkConfigName: [null],
      ciraConfigName: [null]
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
            return throwError(err)
          }), finalize(() => {
            this.isLoading = false
          })).subscribe(data => {
          this.isEdit = true
          this.profileForm.controls.profileName.disable()
          this.pageTitle = data.profileName
          this.tags = data.tags
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

    this.profileForm.controls.generateRandomPassword?.valueChanges.subscribe(value => this.generateRandomPasswordChange(value))
    this.profileForm.controls.generateRandomMEBxPassword?.valueChanges.subscribe(value => this.generateRandomMEBxPasswordChange(value))
  }

  generateRandomPasswordChange (value: boolean): void {
    if (value) {
      this.profileForm.controls.amtPassword.disable()
      this.profileForm.controls.amtPassword.clearValidators()
      this.profileForm.controls.amtPassword.setValue(null)
      this.profileForm.controls.passwordLength.setValidators([Validators.max(32), Validators.min(8)])
      this.profileForm.controls.passwordLength.enable()
    } else {
      this.profileForm.controls.amtPassword.enable()
      this.profileForm.controls.amtPassword.setValidators(Validators.required)
      this.profileForm.controls.passwordLength.disable()
      this.profileForm.controls.passwordLength.clearValidators()
    }
  }

  generateRandomMEBxPasswordChange (value: boolean): void {
    if (value) {
      this.profileForm.controls.mebxPassword.disable()
      this.profileForm.controls.mebxPassword.clearValidators()
      this.profileForm.controls.mebxPassword.setValue(null)
      this.profileForm.controls.mebxPasswordLength.setValidators([Validators.max(32), Validators.min(8)])
      this.profileForm.controls.mebxPasswordLength.enable()
    } else {
      this.profileForm.controls.mebxPassword.enable()
      this.profileForm.controls.mebxPassword.setValidators(Validators.required)
      this.profileForm.controls.mebxPasswordLength.disable()
      this.profileForm.controls.mebxPasswordLength.clearValidators()
    }
  }

  async cancel (): Promise<void> {
    await this.router.navigate(['/profiles'])
  }

  remove (tag: string): void {
    const index = this.tags.indexOf(tag)

    if (index >= 0) {
      this.tags.splice(index, 1)
    }
  }

  add (event: MatChipInputEvent): void {
    const input = event.input
    const value = event.value

    // Add our fruit
    if ((value || '').trim()) {
      this.tags.push(value.trim())
    }

    // Reset the input value
    if (input) {
      input.value = ''
    }
  }

  onSubmit (): void {
    if (this.profileForm.valid) {
      this.isLoading = true
      const result: any = Object.assign({}, this.profileForm.getRawValue())
      result.tags = this.tags
      let request
      if (this.isEdit) {
        request = this.profilesService.update(result)
      } else {
        request = this.profilesService.create(result)
      }
      request.pipe(
        catchError(err => {
        // TODO: handle error better
          console.log(err)
          this.snackBar.open($localize`Error creating/updating profile`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }), finalize(() => {
          this.isLoading = false
        })).subscribe(data => {
        this.snackBar.open($localize`Profile created/updated successfully`, undefined, SnackbarDefaults.defaultSuccess)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.router.navigate(['/profiles'])
      })
    }
  }
}
