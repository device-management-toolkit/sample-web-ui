/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, Inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatChipInputEvent } from '@angular/material/chips'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { caseInsensitiveCompare } from '../../../utils'

@Component({
  selector: 'device-edit-tags',
  templateUrl: './edit-tags.component.html',
  styleUrls: ['./edit-tags.component.css']
})
export class DeviceEditTagsComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA]
  tagsHaveChanged: boolean

  constructor (
    public dialogRef: MatDialogRef<DeviceEditTagsComponent>,
    @Inject(MAT_DIALOG_DATA) public tags: string[]
  ) {
    this.tagsHaveChanged = false
  }

  ngOnInit (): void {
  }

  add (event: MatChipInputEvent): void {
    const value = (event.value || '').trim()
    if (value !== '' && !this.tags.includes(value)) {
      this.tags.push(value)
      this.tags.sort(caseInsensitiveCompare)
      this.tagsHaveChanged = true
    }
    event.chipInput?.clear()
  }

  remove (tag: string): void {
    const index = this.tags.indexOf(tag)
    if (index >= 0) {
      this.tags.splice(index, 1)
      this.tagsHaveChanged = true
    }
  }

  done (): void {
    this.dialogRef.close(this.tagsHaveChanged)
  }

  cancel (): void {
    this.dialogRef.close(false)
  }
}
