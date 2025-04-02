import { Component, Input, OnInit, inject, signal } from '@angular/core'
import { catchError, finalize, throwError } from 'rxjs'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatProgressBarModule } from '@angular/material/progress-bar'

@Component({
  selector: 'app-tls',
  imports: [
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './tls.component.html',
  styleUrl: './tls.component.scss'
})
export class TLSComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)

  @Input()
  public deviceId = ''

  public isLoading = signal(true)
  public tlsData?: any[] = []

  ngOnInit(): void {
    this.devicesService
      .getTLSSettings(this.deviceId)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving tls settings`, undefined, SnackbarDefaults.defaultError)
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
