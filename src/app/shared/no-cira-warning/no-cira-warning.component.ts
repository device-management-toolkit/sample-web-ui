/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component } from '@angular/core'
import { MatButton } from '@angular/material/button'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { TranslatePipe } from '@ngx-translate/core'
import { MatIcon } from '@angular/material/icon'

@Component({
  selector: 'app-no-cira-warning',
  templateUrl: './no-cira-warning.component.html',
  styleUrls: ['./no-cira-warning.component.scss'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslatePipe,
    MatDialogClose,
    MatIcon
  ]
})
export class NoCIRAWarningComponent {}
