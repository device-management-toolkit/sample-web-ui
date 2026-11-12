/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog'
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field'
import { MatInput } from '@angular/material/input'
import { TranslatePipe } from '@ngx-translate/core'
import { finalize } from 'rxjs'
import { Device } from '../../../models/models'
import { DevicesService } from '../devices.service'

// Collects the AMT admin credentials of an already-activated discovered device.
// Console validates them by connecting to the device before it marks it managed.
@Component({
  selector: 'app-manage-device-dialog',
  templateUrl: './manage-device-dialog.component.html',
  styleUrl: './manage-device-dialog.component.scss',
  imports: [
    ReactiveFormsModule,
    CdkScrollable,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    MatSuffix,
    MatTooltip,
    TranslatePipe
  ]
})
export class ManageDeviceDialogComponent {
  private readonly fb = inject(FormBuilder)
  private readonly devicesService = inject(DevicesService)
  private readonly dialogRef = inject<MatDialogRef<ManageDeviceDialogComponent, boolean>>(MatDialogRef)
  protected readonly device = inject<Device>(MAT_DIALOG_DATA)

  public readonly hidePassword = signal(true)
  public readonly submitting = signal(false)
  // Translation key of the last failure; the dialog stays open so the user can retry.
  public readonly errorKey = signal<string | null>(null)

  public readonly form = this.fb.nonNullable.group({
    username: ['admin', Validators.required],
    password: ['', Validators.required]
  })

  submit(): void {
    if (this.form.invalid || this.submitting()) return
    this.submitting.set(true)
    this.errorKey.set(null)
    this.devicesService
      .adoptDevice(this.device.guid, this.form.getRawValue())
      // The error interceptor completes silently on a gateway timeout, so always re-enable the form.
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: unknown) => this.errorKey.set(this.errorKeyFor(err))
      })
  }

  private errorKeyFor(err: unknown): string {
    switch (err instanceof HttpErrorResponse ? err.status : undefined) {
      case 401:
      case 403:
        return 'devices.manage.error.unauthorized.value'
      case 0:
      case 502:
        return 'devices.manage.error.unreachable.value'
      case 408:
      case 504:
        return 'devices.manage.error.timeout.value'
      default:
        return 'devices.manage.error.generic.value'
    }
  }
}
