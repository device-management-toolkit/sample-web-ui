/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog'
import { DevicesService } from 'src/app/devices/devices.service'
import { Device } from 'src/models/models'
import { MatButton } from '@angular/material/button'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel, MatHint, MatError, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatIcon } from '@angular/material/icon'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-add-device-enterprise',
  templateUrl: './add-device-enterprise.component.html',
  styleUrl: './add-device-enterprise.component.scss',
  imports: [
    CommonModule,
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
    TranslateModule
  ],
  providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } }]
})
export class AddDeviceEnterpriseComponent {
  // Dependency Injection
  private readonly fb = inject(FormBuilder)
  private readonly deviceService = inject(DevicesService)
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
    useTLS: [false],
    allowSelfSigned: [false]
  })
  public readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  public tags: string[] = []

  constructor() {
    const device = this.device

    this.deviceOrig = device
    if (device != null) {
      this.tags = device.tags || []
    }
    this.form.patchValue(device)
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim()
    if (value !== '' && !this.tags.includes(value)) {
      this.tags.push(value)
      this.tags.sort()
    }
    event.chipInput?.clear()
  }

  remove(tag: string): void {
    const index = this.tags.indexOf(tag)

    if (index >= 0) {
      this.tags.splice(index, 1)
    }
  }

  // Method to submit form
  submitForm(): void {
    if (this.form.valid) {
      const device: Device = { ...this.form.value }
      device.tags = this.tags
      if (this.deviceOrig?.guid != null && this.deviceOrig?.guid !== '') {
        device.guid = this.deviceOrig.guid
        this.deviceService.editDevice(device).subscribe(() => {
          this.dialog.close()
        })
      } else {
        this.deviceService.addDevice(device).subscribe(() => {
          this.dialog.close()
        })
      }
    }
  }
}
