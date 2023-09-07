/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
  selector: 'app-device-enable-kvm',
  templateUrl: './device-enable-kvm.component.html',
  styleUrls: ['./device-enable-kvm.component.scss']
})
export class DeviceEnableKvmComponent {
  constructor (public dialogRef: MatDialogRef<DeviceEnableKvmComponent>) { }
}
