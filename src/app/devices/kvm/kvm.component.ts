/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, EventEmitter, Output, OnDestroy } from '@angular/core'
import { AMTDesktop, ConsoleLogger, ILogger, Protocol, AMTKvmDataRedirector, DataProcessor, IDataProcessor, MouseHelper, KeyBoardHelper } from 'ui-toolkit'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { fromEvent, interval, of, Subscription } from 'rxjs'
import { catchError, finalize, mergeMap, throttleTime } from 'rxjs/operators'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { ActivatedRoute, Router } from '@angular/router'
import { environment } from 'src/environments/environment'
@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss']
})
export class KvmComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvas: ElementRef | undefined
  public context!: CanvasRenderingContext2D

  // setting a width and height for the canvas
  @Input() public width = 400
  @Input() public height = 400
  @Output() deviceState: number = 0
  @Output() deviceStatus: EventEmitter<number> = new EventEmitter<number>()
  stopSocketSubscription!: Subscription
  startSocketSubscription!: Subscription
  module: any
  redirector: any
  dataProcessor!: IDataProcessor | null
  mouseHelper!: MouseHelper
  keyboardHelper!: KeyBoardHelper
  logger!: ILogger
  powerState: any = 0
  btnText: string = 'Disconnect'
  isPoweredOn: boolean = false
  isLoading: boolean = false
  deviceId: string = ''
  selected: number = 2
  timeInterval!: any
  server: string = environment.mpsServer.replace('https://', '')
  previousAction: string = 'kvm'
  selectedAction: string = ''
  mouseMove: any = null
  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, private readonly devicesService: DevicesService, public readonly activatedRoute: ActivatedRoute, public readonly router: Router) {

  }

  ngOnInit (): void {
    this.logger = new ConsoleLogger(1)
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
    })
    this.stopSocketSubscription = this.devicesService.stopwebSocket.subscribe(() => {
      this.stopKvm()
    })

    this.startSocketSubscription = this.devicesService.connectKVMSocket.subscribe(() => {
      this.init()
    })
    this.timeInterval = interval(15000).pipe(mergeMap(() => this.devicesService.getPowerState(this.deviceId))).subscribe()
  }

  ngDoCheck (): void {
    if (this.selectedAction !== this.previousAction) {
      this.previousAction = this.selectedAction
    }
  }

  checkPowerStatus (): boolean {
    return this.powerState.powerstate === 2
  }

  ngAfterViewInit (): void {
    this.init()
  }

  instantiate (): void {
    this.context = this.canvas?.nativeElement.getContext('2d')
    this.redirector = new AMTKvmDataRedirector(this.logger, Protocol.KVM, new FileReader(), this.deviceId, 16994, '', '', 0, 0, `${this.server}/relay`)
    this.module = new AMTDesktop(this.logger as any, this.context)
    this.dataProcessor = new DataProcessor(this.logger, this.redirector, this.module)
    this.mouseHelper = new MouseHelper(this.module, this.redirector, 200)
    this.keyboardHelper = new KeyBoardHelper(this.module, this.redirector)

    this.redirector.onProcessData = this.module.processData.bind(this.module)
    this.redirector.onStart = this.module.start.bind(this.module)
    this.redirector.onNewState = this.module.onStateChange.bind(this.module)
    this.redirector.onSendKvmData = this.module.onSendKvmData.bind(this.module)
    this.redirector.onStateChanged = this.onConnectionStateChange.bind(this)
    this.redirector.onError = this.onRedirectorError.bind(this)
    this.module.onSend = this.redirector.send.bind(this.redirector)
    this.module.onProcessData = this.dataProcessor.processData.bind(this.dataProcessor)
    this.module.bpp = this.selected
    this.mouseMove = fromEvent(this.canvas?.nativeElement, 'mousemove')
    this.mouseMove.pipe(throttleTime(200)).subscribe((event: any) => {
      if (this.mouseHelper != null) {
        this.mouseHelper.mousemove(event)
      }
    })
  }

  autoConnect (): void {
    if (this.redirector != null) {
      this.redirector.start(WebSocket)
      this.keyboardHelper.GrabKeyInput()
    }
  }

  onRedirectorError (): void {
    this.reset()
  }

  connectKvm (): void {
    this.init()
  }

  init (): void {
    this.setAmtFeatures()
    this.isLoading = true
    this.devicesService.getPowerState(this.deviceId).pipe(
      catchError(() => {
        this.snackBar.open($localize`Error retrieving power status`, undefined, SnackbarDefaults.defaultError)
        return of()
      }), finalize(() => {
      })
    ).subscribe(data => {
      this.powerState = data
      this.isPoweredOn = this.checkPowerStatus()
      if (!this.isPoweredOn) {
        this.isLoading = false
        const dialog = this.dialog.open(PowerUpAlertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.isLoading = true
            this.devicesService.sendPowerAction(this.deviceId, 2).pipe().subscribe(data => {
              this.instantiate()
              setTimeout(() => {
                this.isLoading = false
                this.autoConnect()
              }, 4000)
            })
          }
        })
      } else {
        this.instantiate()
        setTimeout(() => {
          this.isLoading = false
          this.autoConnect()
        }, 0)
      }
    })
  }

  setAmtFeatures (): void {
    this.devicesService.setAmtFeatures(this.deviceId).pipe(
      catchError(() => {
        this.snackBar.open($localize`Error enabling kvm`, undefined, SnackbarDefaults.defaultError)
        return of()
      }), finalize(() => {
      })
    ).subscribe()
  }

  onMouseup (event: MouseEvent): void {
    if (this.mouseHelper != null) {
      this.mouseHelper.mouseup(event)
    }
  }

  onMousedown (event: MouseEvent): void {
    if (this.mouseHelper != null) {
      this.mouseHelper.mousedown(event)
    }
  }

  reset = (): void => {
    this.redirector = null
    this.module = null
    this.dataProcessor = null
    this.height = 400
    this.width = 400
    this.instantiate()
  }

  stopKvm = (): void => {
    this.redirector.stop()
    this.keyboardHelper.UnGrabKeyInput()
    this.reset()
  }

  onConnectionStateChange = (redirector: any, state: number): any => {
    this.deviceState = state
    this.deviceStatus.emit(state)
  }

  ngOnDestroy (): void {
    if (this.timeInterval) {
      this.timeInterval.unsubscribe()
    }
    this.stopKvm()
    if (this.startSocketSubscription) {
      this.startSocketSubscription.unsubscribe()
    }
    if (this.stopSocketSubscription) {
      this.stopSocketSubscription.unsubscribe()
    }
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${this.deviceId}/${path}`])
  }
}
