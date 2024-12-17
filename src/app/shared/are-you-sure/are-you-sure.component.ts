/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'

@Component({
  selector: 'app-are-you-sure',
  templateUrl: './are-you-sure.component.html',
  styleUrls: ['./are-you-sure.component.scss'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose
  ]
})
export class AreYouSureDialogComponent {}
