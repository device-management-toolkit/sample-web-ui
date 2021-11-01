import { Component, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import { Router } from '@angular/router'
import { IMqttServiceOptions } from 'ngx-mqtt'
import { Subscription } from 'rxjs'
import { MQTTService } from './event-channel.service'

@Component({
  selector: 'app-event-channel',
  templateUrl: './event-channel.component.html',
  styleUrls: ['./event-channel.component.scss']
})
export class EventChannelComponent implements OnInit {
  public eventChannelForm: FormGroup
  public errorMessages: string[] = []
  public displayedColumns: string[] = ['guid', 'message', 'type', 'methods', 'timestamp']
  public mpsSubscription!: Subscription
  public rpsSubscription!: Subscription
  public dataSource = new MatTableDataSource()
  public defaultConfig: IMqttServiceOptions
  public status: boolean = false

  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator
  @ViewChild(MatSort, { static: false }) sort!: MatSort

  constructor (public fb: FormBuilder, public readonly router: Router, public eventChannelService: MQTTService) {
    this.defaultConfig = eventChannelService.mqttConfig
    this.eventChannelForm = fb.group({
      hostname: [this.defaultConfig.hostname, Validators.required],
      port: [this.defaultConfig.port],
      path: [this.defaultConfig.path, Validators.required]
    })
    this.eventChannelService.messageSource.subscribe((data: any) => {
      this.dataSource.data = data
    })
    this.eventChannelService.connectionStatusSubject.subscribe((state: number) => {
      this.status = state === 2
    })
  }

  ngOnInit (): void {
  }

  ngAfterViewInit (): void {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  onSubmit (): void {
    this.eventChannelService.changeConnection({ ...this.eventChannelForm.value, protocol: 'wss' })
  }

  isNoData (): boolean {
    return this.dataSource.data.length === 0
  }
}
