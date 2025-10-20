import { DatePipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatListModule } from '@angular/material/list'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { TranslateModule } from '@ngx-translate/core'

@Component({
  selector: 'app-device-cert-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    DatePipe,
    TranslateModule
  ],
  templateUrl: './device-cert-dialog.component.html',
  styleUrl: './device-cert-dialog.component.scss'
})
export class DeviceCertDialogComponent {
  // Dependency Injection
  private readonly deviceService = inject(DevicesService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialogData = inject(MAT_DIALOG_DATA)
  private readonly ref = inject(MatDialogRef)
  public data: any = {}
  public isPinned = false

  constructor() {
    const dialogData = this.dialogData

    this.data = dialogData.certData
    this.isPinned = dialogData.isPinned
  }

  pin(): void {
    this.deviceService.pinDeviceCertificate(this.data.guid, this.data.sha256Fingerprint).subscribe(() => {
      this.snackBar.open('Certificate pinned', 'Close', SnackbarDefaults.defaultSuccess)
      this.ref.close(true)
    })
  }

  remove(): void {
    this.deviceService.deleteDeviceCertificate(this.data.guid).subscribe(() => {
      this.snackBar.open('Certificate removed', 'Close', SnackbarDefaults.defaultSuccess)
      this.ref.close(false)
    })
  }
}
