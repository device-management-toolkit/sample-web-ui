import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core'
import { Terminal } from 'xterm'
import { AmtTerminal, AMTRedirector, TerminalDataProcessor, ConsoleLogger, Protocol, LogLevel } from 'ui-toolkit'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'

import { environment } from 'src/environments/environment'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { PoweralertComponent } from './poweralert/poweralert.component'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SolComponent implements OnInit {
  @Input() solStatus: boolean = false
  @Output() deviceStatus: EventEmitter<number> = new EventEmitter<number>()
  @Input() selectedAction: string = ''
  public term: any
  public container!: any
  public terminal: any
  public logger: ConsoleLogger = new ConsoleLogger(LogLevel.ERROR)
  public redirector: any
  public server: string = environment.mpsServer.replace('https://', '')
  public uuid: string = ''
  public dataProcessor: any
  public deviceState: number = 0
  public powerState: any = 0
  public isPoweredOn: boolean = false
  public previousAction: string = 'sol'

  constructor(private readonly activatedRoute: ActivatedRoute, private readonly deviceService: DevicesService, public snackBar: MatSnackBar, public dialog: MatDialog) { }


  ngOnInit(): void {
    console.log("ngOnInit sol")
    this.activatedRoute.params.subscribe(params => {
      this.uuid = params.id
    })
    this.setAmtFeatures()
    this.deviceService.getPowerState(this.uuid).pipe(
      catchError(err => {
        console.log(err, "coming error case")
        this.snackBar.open($localize`Error enabling sol`, undefined, SnackbarDefaults.defaultError)
        return of()
      }),
      finalize(() => {
      })
    ).subscribe(data => {
      this.powerState = data
      this.isPoweredOn = this.checkPowerStatus()
      if (!this.isPoweredOn) {
        const dialog = this.dialog.open(PoweralertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.deviceService.sendPowerAction(this.uuid, 2).pipe().subscribe(data => {
              this.init()
              this.startSol()
            })
          }
        })
      } else {
        this.init()
        this.startSol()
      }
    })
  }
  setAmtFeatures = (): void => {
    this.deviceService.SetAmtFeatures(this.uuid).pipe(
      catchError((err: any) => {
        // TODO: handle error better
        console.log(err)
        this.snackBar.open($localize`Error enabling sol`, undefined, SnackbarDefaults.defaultError)
        return of()
      }), finalize(() => {
      })
    )
  }

  checkPowerStatus = (): boolean => this.powerState.powerstate === 2

  init = (): void => {
    this.terminal = new AmtTerminal()
    this.dataProcessor = new TerminalDataProcessor(this.terminal)
    this.redirector = new AMTRedirector(this.logger, Protocol.SOL, new FileReader(), this.uuid, 16994, '', '', 0, 0, `${this.server}/relay`)
    this.terminal.onSend = this.redirector.send.bind(this.redirector)
    this.redirector.onNewState = this.terminal.StateChange.bind(this.terminal)
    this.redirector.onStateChanged = this.onTerminalStateChange.bind(this)
    this.redirector.onProcessData = this.dataProcessor.processData.bind(this)
    this.dataProcessor.processDataToXterm = this.handleWriteToXterm.bind(this)
    this.dataProcessor.clearTerminal = this.handleClearTerminal.bind(this)
    this.container = document.getElementById('terminal')
    this.term = new Terminal({
      rows: 30,
      cols: 100,
      cursorStyle: 'block',
      fontWeight: 'bold'
    })
    this.term.open(this.container)
    this.term.onData((data: any) => {
      this.handleKeyPress(data)
    })
    this.term.attachCustomKeyEventHandler((e: any) => {
      e.stopPropagation()
      e.preventDefault()
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        return navigator.clipboard.writeText(this.term.getSelection())
      } else if (e.ctrlKey && e.shiftKey && e.keyCode === 86) {
        return navigator.clipboard.readText().then(text => {
          this.handleKeyPress(text)
        })
      } else if (e.code === 'space') {
        return this.handleKeyPress(e.key)
      }
    })
  }

  handleWriteToXterm = (str: string): any => this.term.write(str)

  handleClearTerminal = (): any => this.term.reset()

  onSOLConnect = (e: Event): void => {
    if (this.redirector !== null) {
      if (this.deviceState === 0) {
        this.startSol()
      } else {
        this.stopSol()
      }
    }
  }

  startSol = (): void => {
    if (this.redirector !== null) {
      if (this.deviceState === 0) {
        this.redirector.start(WebSocket)
      }
    }
  }

  stopSol = (): void => {
    this.redirector.stop()
    this.handleClearTerminal()
    this.cleanUp()
  }

  onTerminalStateChange = (redirector: AMTRedirector, state: number): void => {
    this.deviceState = state
    this.deviceStatus.emit(state)
  }

  cleanUp = (): void => {
    this.terminal = null
    this.redirector = null
    this.dataProcessor = null
    this.term = null
  }

  handleKeyPress = (domEvent: any): void => {
    this.terminal.TermSendKeys(domEvent)
  }

  ngDoCheck(): void {
    if (this.selectedAction !== this.previousAction) {
      this.redirector.stop()
      this.cleanUp()
      this.previousAction = this.selectedAction
      console.log(this.selectedAction, "+++++++ngDoCheck2")
    }
    // console.log(this.selectedAction,"+++++++ngDoCheck sol")
  }

  // ngAfterContentInit(){
  //   console.log("ngAfterContentInit sol")
  // }

  // ngAfterContentChecked(){
  //   console.log("ngAfterContentChecked sol")
  // }

  // ngAfterViewInit(){
  //   console.log("ngAfterViewInit sol")
  // }

  // ngAfterViewChecked(){
  //   console.log("ngAfterViewChecked sol")
  // }

  ngOnDestroy(): void {
    console.log("ngOnDestroy sol")
    this.redirector.stop()
    this.cleanUp()
  }
}
