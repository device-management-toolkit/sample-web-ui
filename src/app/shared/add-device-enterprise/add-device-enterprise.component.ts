/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms'
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

@Component({
  selector: 'app-add-device-enterprise',
  templateUrl: './add-device-enterprise.component.html',
  styleUrl: './add-device-enterprise.component.scss',
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    ReactiveFormsModule,
    FormsModule,
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
    allowSelfSigned: [false],
    guid: [''],
    mpsusername: ['admin'],
    mpspassword: ['', [Validators.minLength(8)]]
  })
  public readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  public tags: string[] = []
  public useCIRA = false

  constructor() {
    const device = this.device

    this.deviceOrig = device
    if (device != null) {
      this.tags = device.tags || []
      // If device has mpsusername set, it's a CIRA device
      if (device.mpsusername != null && device.mpsusername !== '') {
        this.useCIRA = true
      }
    }
    this.form.patchValue(device)
    // Ensure mpsusername defaults to admin if empty
    if (!this.form.get('mpsusername')?.value) {
      this.form.patchValue({ mpsusername: 'admin' })
    }
    // Apply CIRA state after patching form
    this.onCIRAChange(this.useCIRA)
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

  onCIRAChange(checked: boolean): void {
    this.useCIRA = checked
    if (checked) {
      // CIRA mode: set values first, then disable controls
      this.form.patchValue({
        useTLS: false,
        allowSelfSigned: false,
        username: 'admin',
        mpsusername: 'admin'
      })
      this.form.controls['useTLS'].disable()
      this.form.controls['allowSelfSigned'].disable()
      this.form.controls['username'].disable()
      this.form.controls['mpsusername'].disable()
    } else {
      // Non-CIRA mode: enable controls first, then set values
      this.form.controls['useTLS'].enable()
      this.form.controls['allowSelfSigned'].enable()
      this.form.controls['username'].enable()
      this.form.controls['mpsusername'].enable()
      this.form.patchValue({
        guid: '',
        mpsusername: 'admin',
        mpspassword: ''
      })
    }
  }

  // Method to submit form
  submitForm(): void {
    if (this.form.valid) {
      const device: Device = { ...this.form.getRawValue() }
      device.tags = this.tags
      if (this.useCIRA) {
        // Ensure mpsusername is set to admin for CIRA devices
        ;(device as any).mpsusername = 'admin'
      } else {
        // Remove CIRA fields when not using CIRA
        delete (device as any).mpsusername
        delete (device as any).mpspassword
      }
      if (this.deviceOrig?.guid != null && this.deviceOrig?.guid !== '') {
        // Use form's GUID value, don't overwrite with original
        this.deviceService.editDevice(device).subscribe(() => {
          this.dialog.close({ submitted: true })
        })
      } else {
        this.deviceService.addDevice(device).subscribe(() => {
          this.dialog.close({ submitted: true })
        })
      }
    }
  }
}
