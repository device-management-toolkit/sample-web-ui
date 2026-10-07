/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import {
  MatDialogRef,
  MatDialogTitle,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent
} from '@angular/material/dialog'
import { MatButton } from '@angular/material/button'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-device-enable-ider',
  templateUrl: './device-enable-ider.component.html',
  styleUrls: ['./device-enable-ider.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslatePipe,
    MatDialogClose
  ]
})
export class DeviceEnableIderComponent {
  dialogRef = inject<MatDialogRef<DeviceEnableIderComponent>>(MatDialogRef)
}
