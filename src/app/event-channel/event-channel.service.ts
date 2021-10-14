import { EventEmitter, Injectable } from '@angular/core'
import { IMqttMessage, IMqttServiceOptions } from 'ngx-mqtt'
import { BehaviorSubject } from 'rxjs'
import { EventChannel } from 'src/models/models'

@Injectable({
  providedIn: 'root'
})

export class EventChannelService {
  storedData = localStorage.getItem('oact_telemetry')
  private readonly cacheData = this.storedData ? JSON.parse(this.storedData) : []
  public eventChannelLogs: EventChannel = { data: this.cacheData }

  messageSource = new BehaviorSubject<any>(this.eventChannelLogs.data)
  currentMessage = this.messageSource.asObservable()
  reconnectMqttService: EventEmitter<IMqttServiceOptions> = new EventEmitter<IMqttServiceOptions>()

  connectionStatusSource = new BehaviorSubject<number>(0)
  getConnectionStatus = this.connectionStatusSource.asObservable()

  processMessage (message: IMqttMessage): void {
    this.eventChannelLogs.data.splice(0, 0, JSON.parse(message.payload.toString()))
    if (this.eventChannelLogs.data.length > 100) {
      this.eventChannelLogs.data = this.eventChannelLogs.data.slice(0, 100)
    }
    localStorage.setItem('oact_telemetry', JSON.stringify(this.eventChannelLogs.data))
    this.messageSource.next(this.eventChannelLogs.data)
  }

  changeConnection (mqttNewParams: IMqttServiceOptions): void {
    this.reconnectMqttService.emit(mqttNewParams)
  }

  refreshData (): void {
    this.eventChannelLogs.data = []
    this.messageSource.next(this.eventChannelLogs.data)
  }

  connectionStatus (status: number): void {
    this.connectionStatusSource.next(status)
  }
}
