import { Component, Input, OnInit, inject } from '@angular/core'
import { DevicesService } from '../devices.service'
import { MatCardModule } from '@angular/material/card'
import { catchError, finalize, throwError } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatListModule } from '@angular/material/list'
import { MatIcon } from '@angular/material/icon'
import { MatDivider } from '@angular/material/divider'
import { MatProgressBarModule } from '@angular/material/progress-bar'

@Component({
  selector: 'app-network-settings',
  imports: [
    MatCardModule,
    MatListModule,
    MatDivider,
    MatIcon,
    MatProgressBarModule
  ],
  templateUrl: './network-settings.component.html',
  styleUrl: './network-settings.component.scss'
})
export class NetworkSettingsComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  devicesService = inject(DevicesService)

  @Input()
  public deviceId = ''
  isLoading = true
  public networkResults?: any
  ngOnInit(): void {
    this.devicesService
      .getNetworkSettings(this.deviceId)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving network settings`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe((results) => {
        this.networkResults = results
      })
  }
}
