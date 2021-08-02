import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, AfterViewInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { PowerAlertComponent } from './poweralert/poweralert.component'
import { environment } from 'src/environments/environment'
import { AuthService } from 'src/app/auth.service'
import { PowerState } from 'src/models/models'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SolComponent implements OnInit, AfterViewInit {
  isLoading: boolean = false
  deviceId: string = ''
  powerState: PowerState = { powerstate: 0 }
  isPoweredOn: boolean = false
  readyToLoadSol: boolean = false
  mpsServer: string = `${environment.mpsServer.replace('http', 'ws')}/relay`
  authToken: string = ''
  @Input() deviceState: number = 0
  @Output() deviceConnection: EventEmitter<boolean> = new EventEmitter<boolean>(true)
  constructor (private readonly activatedRoute: ActivatedRoute, private readonly deviceService: DevicesService, public snackBar: MatSnackBar, public dialog: MatDialog, public readonly authService: AuthService) {
    this.authToken = this.authService.getLoggedUserToken()
    if (environment.mpsServer.includes('/mps')) { // handles kong route
      this.mpsServer = `${environment.mpsServer.replace('http', 'ws')}/ws/relay`
    }
  }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
    })
    this.deviceService.startwebSocket.subscribe((data: boolean) => {
      this.setAmtFeatures()
      this.deviceConnection.emit(true)
    })
    this.deviceService.stopwebSocket.subscribe((data: boolean) => {
      this.deviceConnection.emit(false)
    })
  }

  ngAfterViewInit (): void {
    this.setAmtFeatures()
  }

  setAmtFeatures (): void {
    this.isLoading = true
    this.deviceService.setAmtFeatures(this.deviceId).pipe(
      catchError(() => {
        // TODO: handle error better
        this.snackBar.open($localize`Error sending amt features`, undefined, SnackbarDefaults.defaultError)
        this.init()
        return of(null)
      }), finalize(() => {
      })
    ).subscribe(() => this.init())
  }

  checkPowerStatus = (): boolean => this.powerState.powerstate === 2

  init (): void {
    this.deviceService.getPowerState(this.deviceId).pipe(
      catchError(() => {
        this.snackBar.open($localize`Error retrieving power status`, undefined, SnackbarDefaults.defaultError)
        return of()
      })
    ).subscribe(data => {
      this.powerState = data as PowerState
      this.isPoweredOn = this.checkPowerStatus()
      if (!this.isPoweredOn) {
        this.isLoading = false
        const dialog = this.dialog.open(PowerAlertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.isLoading = true
            this.deviceService.sendPowerAction(this.deviceId, 2).pipe().subscribe(data => {
              setTimeout(() => {
                this.readyToLoadSol = true
              }, 4000)
            })
          }
        })
      } else {
        setTimeout(() => {
          this.readyToLoadSol = true
        }, 0)
      }
    })
  }

  deviceStatus (event: any): void {
    if (event === 3) {
      this.deviceState = event
      this.isLoading = false
    } else {
      this.deviceState = event
    }
  }

  stopSol (): void {
    this.deviceConnection.emit(false)
  }
}
