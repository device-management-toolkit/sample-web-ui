/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, inject, signal } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog'
import { DevicesService } from '../../devices/devices.service'
import { Device } from '../../../models/models'
import { MatButton } from '@angular/material/button'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel, MatHint, MatError, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatIcon } from '@angular/material/icon'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from '../config/snackBarDefault'
import { isCIRADevice } from '../device-connection'

@Component({
  selector: 'app-add-device-enterprise',
  templateUrl: './add-device-enterprise.component.html',
  styleUrl: './add-device-enterprise.component.scss',
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatIcon,
    MatInput,
    MatChipsModule,
    MatHint,
    MatError,
    MatCheckbox,
    MatButton,
    TranslatePipe
  ],
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }]
})
export class AddDeviceEnterpriseComponent {
  // Dependency Injection
  private readonly fb = inject(FormBuilder)
  private readonly deviceService = inject(DevicesService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly translate = inject(TranslateService)
  private readonly device = inject<Device>(MAT_DIALOG_DATA)
  public readonly dialog = inject<MatDialogRef<AddDeviceEnterpriseComponent>>(MatDialogRef)

  private deviceOrig: Device

  public form: FormGroup = this.fb.group({
    hostname: ['', [Validators.required]],
    friendlyName: ['', [Validators.required, Validators.maxLength(50)]],
    username: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(16)
      ]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    tenantId: [''],
    useTLS: [true],
    allowSelfSigned: [true]
  })
  public readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  public tags = signal<string[]>([])
  // True when the dialog was opened with an existing device.
  public readonly isEdit: boolean
  // CIRA devices are registered by the activation flow, so only their tags can
  // be edited here; every other detail is read-only.
  public readonly isCIRA: boolean

  constructor() {
    const device = this.device

    this.deviceOrig = device
    this.isEdit = device?.guid != null && device.guid !== ''
    this.isCIRA = this.isEdit && isCIRADevice(device)
    if (device != null) {
      this.tags.set(device.tags || [])
      this.form.patchValue(device)
    }
    if (this.isCIRA) {
      this.form.disable()
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim()
    if (value !== '' && !this.tags().includes(value)) {
      this.tags.update((tags) => [...tags, value].sort())
    }
    event.chipInput?.clear()
  }

  remove(tag: string): void {
    this.tags.update((tags) => tags.filter((t) => t !== tag))
  }

  submitForm(): void {
    if (this.isCIRA) {
      // PATCH only the editable field so the server keeps the registered details.
      const tagsOnly = { guid: this.deviceOrig.guid, tags: this.tags() } as Device
      this.deviceService.editDevice(tagsOnly).subscribe({
        next: () => this.dialog.close({ submitted: true }),
        error: (err) => this.showError(err)
      })
      return
    }
    if (this.form.valid) {
      const device: Device = { ...this.form.getRawValue() }
      device.tags = this.tags()
      if (this.isEdit) {
        device.guid = this.deviceOrig.guid
        this.deviceService.editDevice(device).subscribe({
          next: () => this.dialog.close({ submitted: true }),
          error: (err) => this.showError(err)
        })
      } else {
        this.deviceService.addDevice(device).subscribe({
          next: () => this.dialog.close({ submitted: true }),
          error: (err) => this.showError(err)
        })
      }
    }
  }

  // Console explains why an add or edit was rejected (for example, it could not
  // reach the device to read its AMT UUID); surface that instead of failing silently.
  private showError(err: { error?: { message?: string } }): void {
    const message = err?.error?.message || this.translate.instant('error.deviceNotResponding.value')
    this.snackBar.open(message, this.translate.instant('common.dismiss.value'), SnackbarDefaults.defaultError)
  }
}
