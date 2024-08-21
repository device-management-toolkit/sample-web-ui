import { DatePipe } from '@angular/common'
import { Component, Inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatListModule } from '@angular/material/list'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'

@Component({
  selector: 'app-device-cert-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    DatePipe
  ],
  templateUrl: './device-cert-dialog.component.html',
  styleUrl: './device-cert-dialog.component.scss'
})
export class DeviceCertDialogComponent {
  constructor(
    public deviceService: DevicesService,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) public ref: any
  ) {}

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
