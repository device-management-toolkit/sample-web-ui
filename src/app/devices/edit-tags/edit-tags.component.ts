/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, inject } from '@angular/core'
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions
} from '@angular/material/dialog'
import { MatChipInputEvent, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput } from '@angular/material/chips'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { caseInsensitiveCompare } from '../../../utils'
import { MatButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MatFormField, MatLabel } from '@angular/material/form-field'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { CdkScrollable } from '@angular/cdk/scrolling'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-device-edit-tags',
  templateUrl: './edit-tags.component.html',
  styleUrls: ['./edit-tags.component.css'],
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    ReactiveFormsModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatChipGrid,
    MatChipRow,
    MatIcon,
    MatChipRemove,
    MatChipInput,
    MatDialogActions,
    MatButton,
    TranslateModule
  ]
})
export class DeviceEditTagsComponent {
  private readonly dialogRef = inject<MatDialogRef<DeviceEditTagsComponent>>(MatDialogRef)
  public readonly tags = inject(MAT_DIALOG_DATA)

  readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  tagsHaveChanged: boolean

  constructor() {
    this.tagsHaveChanged = false
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim()
    if (value !== '' && !this.tags.includes(value)) {
      this.tags.push(value)
      this.tags.sort(caseInsensitiveCompare)
      this.tagsHaveChanged = true
    }
    event.chipInput?.clear()
  }

  remove(tag: string): void {
    const index = this.tags.indexOf(tag)
    if (index >= 0) {
      this.tags.splice(index, 1)
      this.tagsHaveChanged = true
    }
  }

  done(): void {
    this.dialogRef.close(this.tagsHaveChanged)
  }

  cancel(): void {
    this.dialogRef.close(false)
  }
}
