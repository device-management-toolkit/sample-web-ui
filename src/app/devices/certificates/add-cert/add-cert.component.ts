import { Component, inject } from '@angular/core'
import { DevicesService } from '../../devices.service'
import { CommonModule } from '@angular/common'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { FormsModule } from '@angular/forms'
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { CertInfo } from 'src/models/models'
import { MatCheckboxModule } from '@angular/material/checkbox'

@Component({
  selector: 'app-add-cert',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    MatDialogContent,
    MatDialogActions,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatCardModule,
    MatCheckboxModule
  ],
  templateUrl: './add-cert.component.html',
  styleUrl: './add-cert.component.scss'
})
export class AddCertComponent {
  data = inject(MAT_DIALOG_DATA)
  private readonly deviceService = inject(DevicesService)
  private readonly dialogRef = inject(MatDialogRef<AddCertComponent>)

  certInfo: CertInfo = {
    cert: '',
    isTrustedRoot: false
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
