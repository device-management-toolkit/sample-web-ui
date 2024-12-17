/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'

@Component({
  selector: 'app-power-up-alert',
  templateUrl: './power-up-alert.component.html',
  styleUrls: ['./power-up-alert.component.scss'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose
  ]
})
export class PowerUpAlertComponent {}
