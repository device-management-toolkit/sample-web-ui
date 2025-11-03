/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Component, inject } from '@angular/core'

import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { FormsModule, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { BootDetails, BootSource } from 'src/models/models'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-pba-boot-dialog',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './pba-boot-dialog.component.html',
  styleUrl: './pba-boot-dialog.component.scss'
})
export class PBABootDialogComponent {
  private readonly data = inject(MAT_DIALOG_DATA)
  private readonly dialogRef = inject(MatDialogRef<PBABootDialogComponent>)
  private readonly fb = inject(FormBuilder)

  // Get the boot file paths from injected data
  pbaBootFilePaths: BootSource[] = this.data?.pbaBootFilesPath || []

  bootForm = this.fb.group({
    selectedBootSource: this.fb.control<BootSource | null>(this.pbaBootFilePaths[0] ?? null, Validators.required),
    enforceSecureBoot: this.fb.control(true)
  })

  onCancel(): void {
    this.dialogRef.close()
  }

  onSubmit(): void {
    if (this.bootForm.valid) {
      const selectedBootSource = this.bootForm.value.selectedBootSource as BootSource | null
      if (selectedBootSource) {
        const bootDetails: BootDetails = {
          bootPath: selectedBootSource.bootString,
          enforceSecureBoot: this.bootForm.value.enforceSecureBoot as boolean
        }
        this.dialogRef.close(bootDetails)
      }
    }
  }
}
