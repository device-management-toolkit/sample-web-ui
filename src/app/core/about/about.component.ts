/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnDestroy, OnInit } from '@angular/core'
import { environment } from 'src/environments/environment'
import { MatButton } from '@angular/material/button'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatDivider } from '@angular/material/divider'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { MatIcon } from '@angular/material/icon'
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  imports: [
    MatDialogTitle,
    MatIcon,
    CdkScrollable,
    MatDialogContent,
    MatDivider,
    MatDialogActions,
    ReactiveFormsModule,
    FormsModule,
    MatButton,
    MatDialogClose,
    TranslateModule
  ]
})
export class AboutComponent implements OnDestroy, OnInit {
  doNotShowAgain = false
  cloudMode: boolean = environment.cloud
  ngOnInit(): void {
    const storedValue = localStorage.getItem('doNotShowAgain')
    this.doNotShowAgain = storedValue ? JSON.parse(storedValue) : false
  }

  ngOnDestroy(): void {
    localStorage.setItem('doNotShowAgain', JSON.stringify(this.doNotShowAgain))
  }
}
