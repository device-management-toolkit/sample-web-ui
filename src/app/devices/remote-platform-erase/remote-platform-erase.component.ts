/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal, input } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { finalize, throwError } from 'rxjs'
import { DevicesService } from '../devices.service'
import { AMTFeaturesRequest, AMTFeaturesResponse } from 'src/models/models'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AreYouSureDialogComponent } from 'src/app/shared/are-you-sure/are-you-sure.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-remote-platform-erase',
  templateUrl: './remote-platform-erase.component.html',
  styleUrl: './remote-platform-erase.component.scss',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatIcon,
    MatButton,
    TranslateModule
  ]
})
export class RemotePlatformEraseComponent implements OnInit {
  private readonly devicesService = inject(DevicesService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly matDialog = inject(MatDialog)
  private readonly fb = inject(FormBuilder)
  private readonly translate = inject(TranslateService)

  public readonly deviceId = input('')
  public isLoading = signal(true)

  public amtFeatures: AMTFeaturesResponse = {
    KVM: false,
    SOL: false,
    IDER: false,
    kvmAvailable: false,
    redirection: false,
    optInState: 0,
    userConsent: 'none',
    ocr: false,
    httpsBootSupported: false,
    winREBootSupported: false,
    localPBABootSupported: false,
    remoteErase: false,
    pbaBootFilesPath: [],
    winREBootFilesPath: { instanceID: '', biosBootString: '', bootString: '' }
  }

  public featureForm = this.fb.group({
    remoteErase: false
  })

  ngOnInit(): void {
    this.devicesService
      .getAMTFeatures(this.deviceId())
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (features) => {
          this.amtFeatures = features
          this.featureForm = this.fb.group({
            remoteErase: features.remoteErase
          })
        },
        error: (err) => {
          const msg: string = this.translate.instant('remotePlatformErase.errorLoad.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  toggleFeature(): void {
    this.isLoading.set(true)
    const payload: AMTFeaturesRequest = {
      ...this.amtFeatures,
      userConsent: this.amtFeatures.userConsent,
      enableKVM: this.amtFeatures.KVM,
      enableSOL: this.amtFeatures.SOL,
      enableIDER: this.amtFeatures.IDER,
      ocr: this.amtFeatures.ocr,
      remoteErase: this.featureForm.get('remoteErase')?.value ?? false
    }
    this.devicesService
      .setAmtFeatures(this.deviceId(), payload)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (results) => {
          this.amtFeatures = results
          const msg: string = this.translate.instant('remotePlatformErase.updateSuccess.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
        },
        error: (err) => {
          const msg: string = this.translate.instant('remotePlatformErase.updateError.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(() => err)
        }
      })
  }

  initiateErase(): void {
    const dialogRef = this.matDialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading.set(true)
        this.devicesService
          .sendRemotePlatformErase(this.deviceId())
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: () => {
              const msg: string = this.translate.instant('remotePlatformErase.eraseSuccess.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
            },
            error: (err) => {
              const msg: string = this.translate.instant('remotePlatformErase.eraseError.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
              return throwError(() => err)
            }
          })
      }
    })
  }
}
