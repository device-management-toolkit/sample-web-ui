/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog'
import { TranslatePipe } from '@ngx-translate/core'

// Data passed to the dialog. messageKey is a translation key (including the `.value`
// suffix) so the caller can pick the warning that matches the change being saved.
export interface NetworkChangeAlertData {
  messageKey: string
}

@Component({
  selector: 'app-network-change-alert',
  templateUrl: './network-change-alert.component.html',
  styleUrls: ['./network-change-alert.component.scss'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslatePipe
  ]
})
export class NetworkChangeAlertComponent {
  public readonly data = inject<NetworkChangeAlertData>(MAT_DIALOG_DATA)
}
