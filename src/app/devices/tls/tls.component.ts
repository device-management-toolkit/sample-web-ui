import { Component, OnInit, inject, signal, input } from '@angular/core'
import { catchError, finalize, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-tls',
  imports: [
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './tls.component.html',
  styleUrl: './tls.component.scss'
})
export class TLSComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  public readonly deviceId = input('')

  public isLoading = signal(true)
  public tlsData?: any[] = []

  ngOnInit(): void {
    this.devicesService
      .getTLSSettings(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('tls.errorSettings.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((results) => {
        this.tlsData = results
      })
  }
}
