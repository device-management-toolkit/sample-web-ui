/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ChangeDetectorRef, Component, inject } from '@angular/core'
import { MatSelectModule } from '@angular/material/select'
import { FormsModule } from '@angular/forms'
import { MatDialogContent, MatDialogActions, MatDialogRef, MatDialogModule } from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { CertInfo } from '../../../../models/models'
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
  private readonly cdr = inject(ChangeDetectorRef)

  certInfo: CertInfo = {
    cert: '',
    isTrusted: false
  }

  onFileSelected(e: Event): void {
    if (typeof FileReader === 'undefined') return
    if (e.target == null) return
    const target = e.target as HTMLInputElement
    const files = target.files
    if (files == null || files.length === 0) return

    const file = files[0]
    const isPem = file.name.toLowerCase().endsWith('.pem')
    const reader = new FileReader()

    reader.onload = (e2: ProgressEvent<FileReader>) => {
      const result = e2.target?.result as string
      let cert: string
      if (isPem) {
        cert = result
          .replace(/-----BEGIN CERTIFICATE-----/g, '')
          .replace(/-----END CERTIFICATE-----/g, '')
          .replace(/\s+/g, '')
      } else {
        const index: number = result.indexOf('base64,')
        cert = result.substring(index + 7, result.length)
      }
      this.certInfo.cert = cert
      this.cdr.detectChanges()
    }

    if (isPem) {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
