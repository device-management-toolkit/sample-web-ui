import { Component, OnInit, inject, signal, input } from '@angular/core'
import { DevicesService } from '../devices.service'
import { MatCardModule } from '@angular/material/card'
import { catchError, finalize, throwError } from 'rxjs'
import { MatSnackBar } from '@angular/material/snack-bar'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatListModule } from '@angular/material/list'
import { MatIcon } from '@angular/material/icon'
import { MatDivider } from '@angular/material/divider'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { NetworkConfig } from 'src/models/models'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-network-settings',
  imports: [
    MatCardModule,
    MatListModule,
    MatDivider,
    MatIcon,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './network-settings.component.html',
  styleUrl: './network-settings.component.scss'
})
export class NetworkSettingsComponent implements OnInit {
  // Dependency Injection
  private readonly snackBar = inject(MatSnackBar)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  public readonly deviceId = input('')

  public isLoading = signal(true)
  public networkResults?: NetworkConfig

  ngOnInit(): void {
    this.devicesService
      .getNetworkSettings(this.deviceId())
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('network.errorNetworkSetting.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((results) => {
        this.networkResults = results
      })
  }
}
