/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { DevicesService } from '../devices/devices.service'
import { MonacoEditorModule } from 'ngx-monaco-editor-v2'
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatSelectModule } from '@angular/material/select'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { Observable, startWith, map } from 'rxjs'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { AsyncPipe } from '@angular/common'

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    MonacoEditorModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatToolbarModule,
    MatAutocompleteModule,
    FormsModule,
    AsyncPipe
  ],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss'
})
export class ExplorerComponent implements OnInit {
  XMLData: any
  myControl = new FormControl('')
  editorOptions = { theme: 'vs-dark', language: 'xml', minimap: { enabled: false } }
  wsmanOperations: string[] = []
  selectedWsmanOperation = ''
  filteredOptions!: Observable<string[]>
  constructor(
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    public readonly router: Router,
    private readonly devicesService: DevicesService,
    public readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.devicesService.getWsmanOperations().subscribe((data) => {
      this.wsmanOperations = data
      this.selectedWsmanOperation = this.wsmanOperations[0]
      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value ?? ''))
      )
      this.activatedRoute.params.subscribe((params) => {
        this.devicesService.executeExplorerCall(params.id as string, this.selectedWsmanOperation).subscribe((data) => {
          this.XMLData = data
        })
      })
    })
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase()

    return this.wsmanOperations.filter((option) => option.toLowerCase().includes(filterValue))
  }

  inputChanged(value: any): void {
    this.selectedWsmanOperation = value
    this.activatedRoute.params.subscribe((params) => {
      this.devicesService.executeExplorerCall(params.id as string, this.selectedWsmanOperation).subscribe((data) => {
        this.XMLData = data
      })
    })
  }
}
