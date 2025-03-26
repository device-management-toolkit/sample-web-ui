/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { BootDetails } from 'src/models/models'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-http-boot-dialog',
  imports: [
    CommonModule,
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
  templateUrl: './http-boot-dialog.component.html',
  styleUrl: './http-boot-dialog.component.scss'
})
export class HTTPBootDialogComponent {
  data = inject(MAT_DIALOG_DATA)
  private readonly dialogRef = inject(MatDialogRef<HTTPBootDialogComponent>)
  private fb = inject(FormBuilder)

  hidePassword = true
  bootForm: FormGroup

  bootDetails: BootDetails = {
    url: '',
    username: '',
    password: '',
    enforceSecureBoot: true
  }

  constructor() {
    this.bootForm = this.fb.group({
      url: ['', Validators.required],
      username: [''],
      password: [''],
      enforceSecureBoot: [true]
    })

    this.bootForm.get('username')?.valueChanges.subscribe((username) => {
      const passwordControl = this.bootForm.get('password')

      if (username && username.trim() !== '') {
        passwordControl?.setValidators(Validators.required)
      } else {
        passwordControl?.clearValidators()
      }

      passwordControl?.updateValueAndValidity()
    })
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  onSubmit(): void {
    if (this.bootForm.valid) {
      this.bootDetails = this.bootForm.value
      this.dialogRef.close(this.bootDetails)
    }
  }
}
