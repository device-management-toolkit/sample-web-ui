/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core'
import { AMTDesktop, ConsoleLogger, ILogger, Protocol, AMTKvmDataRedirector, DataProcessor, IDataProcessor, MouseHelper, KeyBoardHelper } from 'ui-toolkit'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { PowerUpAlertComponent } from 'src/app/shared/power-up-alert/power-up-alert.component'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { DevicesService } from '../devices.service'
import { environment } from 'src/environments/environment'
@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss']
})
export class KvmComponent implements OnInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef | any
  public context!: CanvasRenderingContext2D

  // setting a width and height for the canvas
  @Input() public width = 400
  @Input() public height = 400
  @Input() deviceUuid: string = ''
  @Input() showKvm: boolean = false
  @Input() encoding: number = 1
  @Output() showKvmChange = new EventEmitter<boolean>()
  @Input() public selectedAction: string = ''
  module: any
  redirector: any
  dataProcessor!: IDataProcessor | null
  mouseHelper!: MouseHelper
  keyboardHelper!: KeyBoardHelper
  logger!: ILogger
  kvmState: number = 0
  powerState: any = 0
  btnText: string = 'Disconnect'
  isPoweredOn: boolean = false
  public isLoading: boolean = false
  server: string = environment.mpsServer.replace('https://', '')
  previousAction: string = 'kvm'

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, private readonly devicesService: DevicesService) {

  }

  // ngOnChanges ():void{
  //   console.log("ngOnChanges kvm")
  // }

  ngOnInit (): void {
    console.log('ngOnInit kvm')
    this.logger = new ConsoleLogger(1)
    this.setAmtFeatures()
    this.isLoading = true
    this.devicesService.getPowerState(this.deviceUuid).pipe(
      catchError(err => {
        // TODO: handle error better
        console.log(err)
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
            this.devicesService.sendPowerAction(this.deviceUuid, 2).pipe().subscribe(data => {
              console.info('canvas', this.canvas)
              this.instantiate()
              setTimeout(() => {
                this.isLoading = false
                this.autoConnect()
              }, 4000)
            })
          }
        })
      } else {
        console.info('canvas', this.canvas)
        this.instantiate()
        this.isLoading = false
        this.autoConnect()
      }
    })
  }

  ngDoCheck (): void {
    if (this.selectedAction !== this.previousAction) {
      this.previousAction = this.selectedAction
    }
  }

  // ngAfterContentInit(){
  //   console.log("ngAfterContentInit kvm")
  // }

  // ngAfterContentChecked(){
  //   console.log("ngAfterContentChecked kvm")
  // }

  // ngAfterViewInit(){
  //   console.log("ngAfterViewInit kvm")
  // }

  // ngAfterViewChecked(){
  //   console.log("ngAfterViewChecked kvm")
  // }

  checkPowerStatus (): boolean {
    return this.powerState.powerstate === 2
  }

  instantiate (): void {
    this.context = this.canvas?.nativeElement.getContext('2d')
    this.redirector = new AMTKvmDataRedirector(this.logger, Protocol.KVM, new FileReader(), this.deviceUuid, 16994, '', '', 0, 0, `${this.server}/relay`)
    this.module = new AMTDesktop(this.logger as any, this.context)
    this.dataProcessor = new DataProcessor(this.logger, this.redirector, this.module)
    this.mouseHelper = new MouseHelper(this.module, this.redirector, 200)
    this.keyboardHelper = new KeyBoardHelper(this.module, this.redirector)

    this.redirector.onProcessData = this.module.processData.bind(this.module)
    this.redirector.onStart = this.module.start.bind(this.module)
    this.redirector.onNewState = this.module.onStateChange.bind(this.module)
    this.redirector.onSendKvmData = this.module.onSendKvmData.bind(this.module)
    this.redirector.onStateChanged = this.onConnectionStateChange
    this.module.onProcessData = this.dataProcessor.processData.bind(this.dataProcessor)
    this.module.onSend = this.redirector.send.bind(this.redirector)
    this.module.bpp = this.encoding
  }

  autoConnect (): void {
    if (this.redirector != null) {
      this.module.bpp = 2
      this.redirector.start(WebSocket)
      this.keyboardHelper.GrabKeyInput()
    }
  }

  setAmtFeatures (): void {
    this.devicesService.setAmtFeatures(this.deviceUuid).pipe(
      catchError((err: any) => {
        // TODO: handle error better
        console.log(err)
        this.snackBar.open($localize`Error enabling kvm`, undefined, SnackbarDefaults.defaultError)
        return of()
      }), finalize(() => {
      })
    ).subscribe()
  }

  @HostListener('mouseup', ['$event'])
  onMouseup (event: MouseEvent): void {
    this.mouseHelper.mouseup(event)
  }

  @HostListener('mousemove', ['$event'])
  onMousemove (event: MouseEvent): void {
    this.mouseHelper.mousemove(event)
  }

  @HostListener('mousedown', ['$event'])
  onMousedown (event: MouseEvent): void {
    this.mouseHelper.mousedown(event)
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
    this.showKvmChange.emit(false)
    this.reset()
  }

  onConnectionStateChange = (redirector: any, state: number): any => {
    this.kvmState = state
    if (state === 0) {
      this.showKvmChange.emit(false)
    }
  }

  ngOnDestroy = (): void => {
    console.log('ngOnDestroy kvm')
    this.stopKvm()
  }
}
