/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, OnInit, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent } from '@angular/material/dialog'
import { DevicesService } from 'src/app/devices/devices.service'
import { Device } from 'src/models/models'
import { MatButton } from '@angular/material/button'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatIcon } from '@angular/material/icon'

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
    MatButton
  ]
})
export class AddDeviceEnterpriseComponent {
  private readonly fb = inject(FormBuilder)
  readonly dialog = inject<MatDialogRef<AddDeviceEnterpriseComponent>>(MatDialogRef)
  device = inject<Device>(MAT_DIALOG_DATA)
  private readonly deviceService = inject(DevicesService)

  form: FormGroup = this.fb.group({
    hostname: ['', [Validators.required]],
    friendlyName: ['', [Validators.required, Validators.maxLength(50)]],
    username: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(16)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    tenantId: [''],
    useTLS: [false],
    allowSelfSigned: [false]
  })

  readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  tags: string[] = []
  deviceOrig: Device
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
        this.deviceService.editDevice(device).subscribe((res) => {
          this.dialog.close()
        })
      } else {
        this.deviceService.addDevice(device).subscribe((res) => {
          this.dialog.close()
        })
      }
    }
  }
}
