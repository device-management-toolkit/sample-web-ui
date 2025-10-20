/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import { MatDialogRef, MatDialogTitle, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { MatButton } from '@angular/material/button'
import { MatCardContent } from '@angular/material/card'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-device-enable-sol',
  templateUrl: './device-enable-sol.component.html',
  styleUrls: ['./device-enable-sol.component.scss'],
  imports: [
    MatDialogTitle,
    MatCardContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    MatDialogClose
  ]
})
export class DeviceEnableSolComponent {
  dialogRef = inject<MatDialogRef<DeviceEnableSolComponent>>(MatDialogRef)
}
