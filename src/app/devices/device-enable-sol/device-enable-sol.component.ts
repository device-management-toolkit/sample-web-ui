/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component } from '@angular/core'
import { MatDialogRef, MatDialogTitle, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { MatButton } from '@angular/material/button'
import { MatCardContent } from '@angular/material/card'

@Component({
  selector: 'app-device-enable-sol',
  templateUrl: './device-enable-sol.component.html',
  styleUrls: ['./device-enable-sol.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatCardContent,
    MatDialogActions,
    MatButton,
    MatDialogClose
  ]
})
export class DeviceEnableSolComponent {
  constructor(public dialogRef: MatDialogRef<DeviceEnableSolComponent>) {}
}
