/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Component, inject } from '@angular/core'
import { MatSelectModule } from '@angular/material/select'
import { FormsModule } from '@angular/forms'
import { MatDialogContent, MatDialogActions, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { CertInfo } from 'src/models/models'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'app-add-cert-dialog',
  imports: [
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './add-cert-dialog.component.html',
  styleUrl: './add-cert-dialog.component.scss'
})
export class AddCertDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddCertDialogComponent>)

  certInfo: CertInfo = {
    cert: '',
    isTrusted: false
  }

  onFileSelected(e: Event): void {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader()

      reader.onload = (e2: ProgressEvent<FileReader>) => {
        const base64: string = e2.target?.result as string
        const index: number = base64.indexOf('base64,')
        const cert = base64.substring(index + 7, base64.length)
        this.certInfo.cert = cert
      }
      if (e.target != null) {
        const target = e.target as HTMLInputElement
        const files = target.files
        if (files != null) {
          reader.readAsDataURL(files[0])
        }
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
