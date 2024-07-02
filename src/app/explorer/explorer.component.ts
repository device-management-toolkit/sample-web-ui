/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { DevicesService } from '../devices/devices.service'
import { MonacoEditorModule } from 'ngx-monaco-editor-v2'
import { FormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatSelectModule } from '@angular/material/select'
import { MatToolbarModule } from '@angular/material/toolbar'

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [MonacoEditorModule, FormsModule, MatCardModule, MatSelectModule, MatToolbarModule],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss'
})
export class ExplorerComponent {
  XMLData: any
  editorOptions = { theme: 'vs-dark', language: 'xml', minimap: { enabled: false } }
  wsmanOperations: string[] = []
  selectedWsmanOperation = ''
  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public readonly router: Router, private readonly devicesService: DevicesService, public readonly activatedRoute: ActivatedRoute) {

  }

  ngOnInit (): void {
    this.devicesService.getWsmanOperations().subscribe(data => {
      this.wsmanOperations = data
      this.selectedWsmanOperation = this.wsmanOperations[0]
      this.activatedRoute.params.subscribe(params => {
        this.devicesService.executeExplorerCall(params.id as string, this.selectedWsmanOperation).subscribe(data => {
          this.XMLData = data
        })
      })
    })
  }

  inputChanged (value: any): void {
    this.selectedWsmanOperation = value
    this.activatedRoute.params.subscribe(params => {
      this.devicesService.executeExplorerCall(params.id as string, this.selectedWsmanOperation).subscribe(data => {
        this.XMLData = data
      })
    })
  }
}
