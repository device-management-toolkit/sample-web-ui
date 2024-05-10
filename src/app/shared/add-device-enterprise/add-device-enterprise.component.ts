/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDialogRef } from '@angular/material/dialog'
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
    useTls: [false],
    allowSelfSigned: [false]
  })

  constructor (private readonly fb: FormBuilder, readonly dialog: MatDialogRef<AddDeviceEnterpriseComponent>, private readonly deviceService: DevicesService) {}

  ngOnInit (): void {

  }

  // Method to submit form
  submitForm (): void {
    if (this.form.valid) {
      const device: Device = { ...this.form.value }
      this.deviceService.addDevice(device).subscribe((res) => {
        this.dialog.close()
      })
      // Here, handle your form submission (e.g., send to an API)
    }
  }
}
