/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-random-pass-alert',
  templateUrl: './random-pass-alert.component.html',
  styleUrls: ['./random-pass-alert.component.scss'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    MatDialogClose
  ]
})
export class RandomPassAlertComponent {}
