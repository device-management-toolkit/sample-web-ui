import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core'
import { Terminal } from 'xterm'
import { AmtTerminal, AMTRedirector, TerminalDataProcessor, ConsoleLogger, Protocol, LogLevel } from 'ui-toolkit'
import { ActivatedRoute } from '@angular/router'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-sol',
  templateUrl: './sol.component.html',
  styleUrls: ['./sol.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SolComponent implements OnInit {
  @Input() solStatus: boolean = false
  @Output() deviceStatus: EventEmitter<number> = new EventEmitter<number>()
  public term: any
  public container!: any
  public terminal: any
  public logger: ConsoleLogger = new ConsoleLogger(LogLevel.ERROR)
  public redirector: any
  public server: string = environment.mpsServer.replace('https://', '')
  public uuid: string = ''
  public dataProcessor: any
  public deviceState: number = 0

  constructor (private readonly activatedRoute: ActivatedRoute) { }

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.uuid = params.id
    })
    this.init()
    if (this.redirector !== 'null') {
      if (this.deviceState === 0) {
        this.redirector.start(WebSocket)
      }
    }
  }

  ngAfterViewInit (): void {
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
  }

  handleWriteToXterm = (str: string): any => this.term.write(str)

  handleClearTerminal = (): any => this.term.reset()

  onSOLConnect = (e: Event): void => {
    if (this.redirector !== 'null') {
      if (this.deviceState === 0) {
        this.startSol()
      } else {
        this.stopSol()
      }
    }
  }

  startSol = (): void => {
    this.redirector.start(WebSocket)
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

  ngOnDestroy (): void {
    this.redirector.start(WebSocket)
    this.cleanUp()
  }
}
