/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { DevicesService } from '../devices/devices.service'

@Component({
  selector: 'app-explorer',
  standalone: false,
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss'
})
export class ExplorerComponent {
  XMLData: any
  editorOptions = { theme: 'vs-dark', language: 'xml', minimap: { enabled: false } }
  wsmanOperations = ['AMT_AlarmClockService']
  selectedWsmanOperation = 'AMT_AlarmClockService'
  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public readonly router: Router, private readonly devicesService: DevicesService, public readonly activatedRoute: ActivatedRoute) {

  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.devicesService.executeExplorerCall(params.id as string, this.selectedWsmanOperation).subscribe(data => {
        this.XMLData = data
      })
    })
  }
}
