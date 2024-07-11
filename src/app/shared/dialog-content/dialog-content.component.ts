/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'

@Component({
  selector: 'app-dialog-content',
  templateUrl: './dialog-content.component.html',
  styleUrls: ['./dialog-content.component.scss'],
  standalone: true,
  imports: [
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose
  ]
})
export class DialogContentComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { name: string }) {}
}
