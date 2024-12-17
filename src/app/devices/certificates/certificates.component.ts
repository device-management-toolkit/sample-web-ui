import { Component, Input, OnInit, inject } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIcon } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatProgressBar } from '@angular/material/progress-bar'
import { catchError, finalize, throwError } from 'rxjs'
import { DevicesService } from '../devices.service'

import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatSnackBar } from '@angular/material/snack-bar'

@Component({
  selector: 'app-certificates',
  imports: [
    MatProgressBar,
    MatCardModule,
    MatIcon,
    MatIconButton,
    MatListModule
  ],
  templateUrl: './certificates.component.html',
  styleUrl: './certificates.component.scss'
})
export class CertificatesComponent implements OnInit {
  private readonly devicesService = inject(DevicesService)
  snackBar = inject(MatSnackBar)

  public isLoading = true
  public certInfo?: any

  @Input()
  public deviceId = ''

  ngOnInit(): void {
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
}
