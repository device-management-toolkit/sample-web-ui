import { Component, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { EventChannelService } from './event-channel.service'

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
  public getDefaultConfig = localStorage.getItem('oact_config')
  public defaultConfig = this.getDefaultConfig ? JSON.parse(this.getDefaultConfig) : { hostname: 'localhost', port: 9001, path: '/mqtt' }
  public status: boolean = false

  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator
  @ViewChild(MatSort, { static: false }) sort!: MatSort

  constructor (public fb: FormBuilder, public readonly router: Router, public eventChannelService: EventChannelService) {
    this.eventChannelForm = fb.group({
      hostname: [this.defaultConfig.hostname, Validators.required],
      port: [this.defaultConfig.port, Validators.required],
      path: [this.defaultConfig.path, Validators.required]
    })
    this.eventChannelService.currentMessage.subscribe((data: any) => {
      this.dataSource.data = data
    })
    this.eventChannelService.getConnectionStatus.subscribe(state => {
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
    this.eventChannelService.changeConnection(this.eventChannelForm.value)
  }

  isNoData (): boolean {
    return this.dataSource.data.length === 0
  }
}
