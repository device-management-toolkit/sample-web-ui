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
import { PowerAlertComponent } from './poweralert/poweralert.component'
import { C, V, SPACE } from '@angular/cdk/keycodes'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SolComponent implements OnInit {
  @Input() solStatus: boolean = false
  @Output() deviceStatus: EventEmitter<number> = new EventEmitter<number>()
  @Output() deviceState: number = 0
  @Input() selectedAction: string = ''
  public term: any
  public container!: any
  public terminal: any
  public logger: ConsoleLogger = new ConsoleLogger(LogLevel.ERROR)
  public redirector: any
  public server: string = environment.mpsServer.replace('https://', '')
  public uuid: string = ''
  public dataProcessor: any
  public powerState: any = 0
  public isPoweredOn: boolean = false
  public previousAction: string = 'sol'
  public isLoading: boolean = false

  constructor(private readonly activatedRoute: ActivatedRoute, private readonly deviceService: DevicesService, public snackBar: MatSnackBar, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.uuid = params.id
    })
    this.setAmtFeatures()
    this.deviceService.getPowerState(this.uuid).pipe(
      catchError(err => {
        this.snackBar.open($localize`Error enabling sol`, undefined, SnackbarDefaults.defaultError)
        return of(null)
      }),
      finalize(() => {
      })
    ).subscribe(data => {
      this.powerState = data
      this.isPoweredOn = this.checkPowerStatus()
      if (!this.isPoweredOn) {
        const dialog = this.dialog.open(PowerAlertComponent)
        dialog.afterClosed().subscribe(result => {
          if (result) {
            this.deviceService.sendPowerAction(this.uuid, 2).pipe(
              catchError(err => {
                this.snackBar.open($localize`Error sending power actions`, undefined, SnackbarDefaults.defaultError)
                return of(null)
              })
            ).subscribe(data => {
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
    this.deviceService.stopwebSocket.subscribe((data: boolean) => {
      this.stopSol()
    })
    this.deviceService.startwebSocket.subscribe((data: boolean) => {
      this.init()
      this.startSol()
    })
  }

  setAmtFeatures = (): void => {
    this.deviceService.setAmtFeatures(this.uuid).pipe(
      catchError((err: any) => {
        // TODO: handle error better
        this.snackBar.open($localize`Error sending amt features`, undefined, SnackbarDefaults.defaultError)
        return of(null)
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
      if (e.ctrlKey && e.shiftKey && e.keyCode === C) {
        return navigator.clipboard.writeText(this.term.getSelection())
      } else if (e.ctrlKey && e.shiftKey && e.keyCode === V) {
        return navigator.clipboard.readText().then(text => {
          this.handleKeyPress(text)
        })
      } else if (e.code === SPACE) {
        return this.handleKeyPress(e.key)
      }
    })
  }

  handleWriteToXterm = (str: string): any => this.term.write(str)

  handleClearTerminal = (): any => this.term.reset()

  onSOLConnect = (e: Event): void => {
    if (this.redirector != null) {
      if (this.deviceState === 0) {
        this.startSol()
      } else {
        this.stopSol()
      }
    }
  }

  startSol = (): void => {
    if (this.redirector != null) {
      if (this.deviceState === 0) {
        this.isLoading = true
        this.redirector.start(WebSocket)
      }
    }
  }

  stopSol = (): void => {
    if (this.redirector != null) {
      this.redirector.stop()
      this.handleClearTerminal()
      this.term.dispose()
      this.cleanUp()
    }
  }

  onTerminalStateChange = (redirector: AMTRedirector, state: number): void => {
    this.deviceState = state
    this.deviceStatus.emit(state)
    if (state === 3) {
      this.isLoading = false
    }
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

  ngOnDestroy(): void {
    if (this.redirector != null) {
      this.redirector.stop()
      this.cleanUp()
    }
  }
}
