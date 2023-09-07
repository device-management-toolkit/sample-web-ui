/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
  selector: 'app-device-enable-sol',
  templateUrl: './device-enable-sol.component.html',
  styleUrls: ['./device-enable-sol.component.scss']
})
export class DeviceEnableSolComponent {
  constructor (public dialogRef: MatDialogRef<DeviceEnableSolComponent>) { }
}
