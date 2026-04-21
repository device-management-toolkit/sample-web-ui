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
import { TranslateModule } from '@ngx-translate/core'
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
    MatDialogClose,
    TranslateModule
  ]
})
export class AreYouSureDialogComponent {
  protected readonly data = inject<{ message?: string } | null>(MAT_DIALOG_DATA, { optional: true })
}
