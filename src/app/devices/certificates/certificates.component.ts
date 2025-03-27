import { Component, Input, OnInit, inject } from '@angular/core'
import { MatCardModule } from '@angular/material/card'
import { MatIcon } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatProgressBar } from '@angular/material/progress-bar'
import { catchError, finalize, throwError } from 'rxjs'
import { DevicesService } from '../devices.service'

import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { CertInfo } from 'src/models/models'
import { AddCertDialogComponent } from './add-cert-dialog/add-cert-dialog.component'
import { TranslateModule } from '@ngx-translate/core'
import { MatButtonModule, MatIconButton } from '@angular/material/button'

@Component({
  selector: 'app-certificates',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatIcon,
    MatButtonModule,
    MatListModule,
    TranslateModule,
    MatIconButton
  ],
  templateUrl: './certificates.component.html',
  styleUrl: './certificates.component.scss'
})
export class CertificatesComponent implements OnInit {
  private readonly dialog = inject(MatDialog)
  private readonly devicesService = inject(DevicesService)
  snackBar = inject(MatSnackBar)

  public isLoading = true
  public certInfo?: any
  public addCert: CertInfo = {
    cert: '',
    isTrusted: false
  }

  @Input()
  public deviceId = ''

  ngOnInit(): void {
    this.getCertificates()
  }

  getCertificates(): void {
    this.devicesService
      .getCertificates(this.deviceId)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving certificate info`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe((certInfo: any) => {
        this.certInfo = certInfo
      })
  }

  downloadCert(cert: any): void {
    let text = ''
    const extension = 'crt'

    text += '-----BEGIN CERTIFICATE-----\n'
    text += cert.x509Certificate
    text += '\n-----END CERTIFICATE-----'

    const blob = new Blob([text], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${cert.displayName}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    window.URL.revokeObjectURL(url)
  }

  isCertEmpty() {
    if (this.certInfo?.certificates) {
      return Object.keys(this.certInfo.certificates).length === 0
    }

    return true
  }

  openAddCertDialog(): void {
    this.isLoading = true

    const dialogRef = this.dialog.open(AddCertDialogComponent, {
      width: '600px',
      disableClose: false
    })

    dialogRef.afterClosed().subscribe((addCert: CertInfo) => {
      if (!addCert || addCert.cert === '') {
        this.isLoading = false
        return
      }

      this.addCertificate(addCert)
      this.isLoading = false
    })
  }

  addCertificate(addCert: CertInfo): void {
    this.devicesService
      .addCertificate(this.deviceId, addCert)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error adding certificate`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe(() => {
        this.getCertificates()
      })
  }
}
