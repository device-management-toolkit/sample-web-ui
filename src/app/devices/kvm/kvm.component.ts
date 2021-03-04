/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core'
import { AMTDesktop, ConsoleLogger, ILogger, Protocol, AMTKvmDataRedirector, DataProcessor, IDataProcessor, MouseHelper, KeyBoardHelper } from 'ui-toolkit'
import { DevicesService } from '../devices.service'
@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss']
})
export class KvmComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef | undefined
  public context!: CanvasRenderingContext2D

  // setting a width and height for the canvas
  @Input() public width = 400
  @Input() public height = 400
  @Input() deviceUuid: string = ''
  @Input() showKvm: boolean = false
  @Output() showKvmChange = new EventEmitter<boolean>()
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

  constructor (private readonly devicesService: DevicesService) {

  }

  ngOnInit (): void {
    this.logger = new ConsoleLogger(1)
  }

  ngAfterViewInit (): void {
    this.instantiate()
    // this.setAmtFeatures()
    this.autoConnect()
  }

  checkPowerStatus (): boolean {
    return this.powerState.powerstate === 2
  }

  instantiate (): void {
    this.context = this.canvas?.nativeElement.getContext('2d')
    this.redirector = new AMTKvmDataRedirector(this.logger, Protocol.KVM, new FileReader(), this.deviceUuid, 16994, '', '', 0, 0, '13.76.223.84:3000/relay')
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
  }

  autoConnect (): void {
    if (this.redirector !== null) {
      this.module.bpp = 2
      this.redirector.start(WebSocket)
      this.keyboardHelper.GrabKeyInput()
    }
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
    // this.context.clearRect(0, 0, 400, 400)
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
}
