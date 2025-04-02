/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, OnInit, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { DevicesService } from '../devices.service'
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2'
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatSelectModule } from '@angular/material/select'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { Observable, startWith, map } from 'rxjs'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { AsyncPipe } from '@angular/common'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'

@Component({
  selector: 'app-explorer',
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
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useValue: {}
    }
  ],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.scss'
})
export class ExplorerComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)
  private readonly router = inject(Router)
  private readonly devicesService = inject(DevicesService)

  @Input()
  public deviceId = ''

  public XMLData: any
  public myControl = new FormControl('')
  public editorOptions = { theme: 'vs-dark', language: 'xml', minimap: { enabled: false } }
  public wsmanOperations: string[] = []
  public selectedWsmanOperation = ''
  public filteredOptions!: Observable<string[]>

  ngOnInit(): void {
    this.devicesService.getWsmanOperations().subscribe((data) => {
      this.wsmanOperations = data
      this.selectedWsmanOperation = this.wsmanOperations[0]
      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value ?? ''))
      )

      this.devicesService.executeExplorerCall(this.deviceId, this.selectedWsmanOperation).subscribe({
        next: (data) => {
          this.XMLData = data
        },
        error: (err) => {
          console.error(err)
          this.snackBar.open($localize`Error retrieving explorer response`, undefined, SnackbarDefaults.defaultError)
        }
      })
    })
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase()

    return this.wsmanOperations.filter((option) => option.toLowerCase().includes(filterValue))
  }

  clearFilter(): void {
    this.myControl.setValue('')
  }

  inputChanged(event: MatAutocompleteSelectedEvent): void {
    this.selectedWsmanOperation = event.option.value
    this.devicesService.executeExplorerCall(this.deviceId, this.selectedWsmanOperation).subscribe({
      next: (data) => {
        this.XMLData = data
      },
      error: (err) => {
        console.error(err)
        this.snackBar.open($localize`Error retrieving explorer response`, undefined, SnackbarDefaults.defaultError)
      }
    })
  }
}
