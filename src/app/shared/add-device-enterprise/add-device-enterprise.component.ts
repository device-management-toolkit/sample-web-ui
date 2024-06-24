/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, Inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from 'src/app/devices/devices.service'
import { Device } from 'src/models/models'

@Component({
  selector: 'app-add-device-enterprise',
  templateUrl: './add-device-enterprise.component.html',
  styleUrl: './add-device-enterprise.component.scss'
})
export class AddDeviceEnterpriseComponent {
  form: FormGroup = this.fb.group({
    hostname: ['', [Validators.required]],
    friendlyName: ['', [Validators.required, Validators.maxLength(50)]],
    username: ['', [Validators.required, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    tenantId: [''],
    useTLS: [false],
    allowSelfSigned: [false]
  })

  deviceOrig: Device
  constructor (private readonly fb: FormBuilder,
    readonly dialog: MatDialogRef<AddDeviceEnterpriseComponent>,
    @Inject(MAT_DIALOG_DATA) public device: Device,
    private readonly deviceService: DevicesService) {
      this.deviceOrig = device
      this.form.patchValue(device)
  }

  ngOnInit (): void {

  }

  // Method to submit form
  submitForm (): void {
    if (this.form.valid) {
      const device: Device = { ...this.form.value }
      if (this.deviceOrig.guid != null && this.deviceOrig.guid !== '') {
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
