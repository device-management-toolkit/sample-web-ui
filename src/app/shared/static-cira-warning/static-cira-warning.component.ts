/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-static-cira-warning',
  templateUrl: './static-cira-warning.component.html',
  styleUrls: ['./static-cira-warning.component.scss'],
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
export class StaticCIRAWarningComponent {
  private readonly translate = inject(TranslateService)
}
