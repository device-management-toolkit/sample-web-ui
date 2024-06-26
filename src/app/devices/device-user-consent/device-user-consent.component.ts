/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { catchError } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { userConsentData } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { MatButton } from '@angular/material/button'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatError, MatHint } from '@angular/material/form-field'
import { CdkScrollable } from '@angular/cdk/scrolling'

@Component({
    selector: 'app-device-user-consent',
    templateUrl: './device-user-consent.component.html',
    styleUrls: ['./device-user-consent.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, ReactiveFormsModule, CdkScrollable, MatDialogContent, MatFormField, MatInput, MatError, MatHint, MatDialogActions, MatButton]
})
export class DeviceUserConsentComponent implements OnInit {
  public userConsentForm: FormGroup
  constructor (
    private readonly formBuilder: FormBuilder,
    public snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DeviceUserConsentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: userConsentData,
    private readonly devicesService: DevicesService) {
    this.userConsentForm = this.formBuilder.group({
      consentCode: [null, Validators.required]
    })
  }

  ngOnInit (): void {
  }

  onCancel (): any {
    this.devicesService.cancelUserConsentCode(this.data.deviceId)
      .pipe(catchError(() => {
        this.snackBar.open($localize`Error cancelling user consent code`, undefined, SnackbarDefaults.defaultError)
        this.dialogRef.close()
        return of()
      }))
      .subscribe(data => {
        this.data.results = data
        this.dialogRef.close(this.data)
      })
  }

  onSubmit (): any {
    if (this.userConsentForm.valid) {
      const result: any = Object.assign({}, this.userConsentForm.getRawValue())
      // An additional user consent code will not be required until a timeout period of 2 minutes of inactivity has elapsed (configurable to 1 to 15 minutes in ACM)
      this.devicesService.sendUserConsentCode(this.data.deviceId, result.consentCode as number)
        .pipe(catchError((err) => {
          this.snackBar.open($localize`Error sending user consent code`, undefined, SnackbarDefaults.defaultError)
          this.dialogRef.close()
          return of(err)
        }))
        .subscribe(data => {
          this.data.results = data
          this.dialogRef.close(this.data)
        })
    }
  }
}
