/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-wifi-disabled-alert',
  templateUrl: './wifi-disabled-alert.component.html',
  styleUrls: ['./wifi-disabled-alert.component.scss'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslatePipe,
    MatDialogClose
  ]
})
export class WifiDisabledAlertComponent {}
