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
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-device-enable-kvm',
  templateUrl: './device-enable-kvm.component.html',
  styleUrls: ['./device-enable-kvm.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    MatDialogClose
  ]
})
export class DeviceEnableKvmComponent {
  dialogRef = inject<MatDialogRef<DeviceEnableKvmComponent>>(MatDialogRef)
}
