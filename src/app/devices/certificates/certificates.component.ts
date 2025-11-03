import { Component, OnInit, inject, signal, input } from '@angular/core'
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
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { MatButtonModule, MatIconButton } from '@angular/material/button'
import { MatTooltip } from '@angular/material/tooltip'

@Component({
  selector: 'app-certificates',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatIcon,
    MatButtonModule,
    MatListModule,
    TranslateModule,
    MatTooltip,
    MatIconButton
  ],
  templateUrl: './certificates.component.html',
  styleUrl: './certificates.component.scss'
})
export class CertificatesComponent implements OnInit {
  private readonly dialog = inject(MatDialog)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  snackBar = inject(MatSnackBar)

  public isLoading = signal(true)
  public certInfo?: any
  public addCert: CertInfo = {
    cert: '',
    isTrusted: false
  }

  public readonly deviceId = input('')

  ngOnInit(): void {
    this.getCertificates()
  }

  getCertificates(): void {
    this.devicesService
      .getCertificates(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('certificates.errorRetrievingCertificates.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((certInfo: any) => {
        this.certInfo = certInfo
        this.isLoading.set(false)
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
    const dialogRef = this.dialog.open(AddCertDialogComponent, {
      width: '600px',
      disableClose: false
    })

    dialogRef.afterClosed().subscribe((addCert: CertInfo) => {
      if (!addCert || addCert.cert === '') {
        return
      }
      this.isLoading.set(true)
      this.addCertificate(addCert)
    })
  }

  addCertificate(addCert: CertInfo): void {
    this.isLoading.set(true)
    this.devicesService
      .addCertificate(this.deviceId(), addCert)
      .pipe(
        catchError((err) => {
          this.isLoading.set(false)
          const msg: string = this.translate.instant('certificates.errorAddingCertificates.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe(() => {
        this.getCertificates()
      })
  }
}
