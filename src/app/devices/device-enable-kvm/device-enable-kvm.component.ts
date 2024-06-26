/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component } from '@angular/core'
import { MatDialogRef, MatDialogTitle, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { MatButton } from '@angular/material/button'
import { MatCardContent } from '@angular/material/card'

@Component({
    selector: 'app-device-enable-kvm',
    templateUrl: './device-enable-kvm.component.html',
    styleUrls: ['./device-enable-kvm.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatCardContent, MatDialogActions, MatButton, MatDialogClose]
})
export class DeviceEnableKvmComponent {
  constructor (public dialogRef: MatDialogRef<DeviceEnableKvmComponent>) { }
}
