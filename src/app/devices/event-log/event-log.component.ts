/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, AfterViewInit, ViewChild, inject, signal } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { EventLog, EventLogResponse } from 'src/models/models'
import { MomentModule } from 'ngx-moment'
import { MatCard, MatCardContent, MatCardHeader, MatCardModule, MatCardTitle } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { environment } from 'src/environments/environment'
import { MatButtonModule } from '@angular/material/button'
import { DeviceLogService } from '../device-log.service'
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { MatIconModule } from '@angular/material/icon'

type EventTypeMap = Record<number, string>
const EVENTTYPEMAP: EventTypeMap = {
  1: 'Threshold based event',
  7: 'Generic severity event',
  10: 'Linkup Event',
  111: 'Sensor specific event'
}

@Component({
  selector: 'app-event-log',
  templateUrl: './event-log.component.html',
  styleUrls: ['./event-log.component.scss'],
  imports: [
    MatProgressBar,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MomentModule,
    MatPaginatorModule,
    MatIconModule
  ]
})
export class EventLogComponent implements AfterViewInit {
  snackBar = inject(MatSnackBar)
  private readonly deviceLogService = inject(DeviceLogService)

  @Input()
  public deviceId = ''

  @ViewChild(MatPaginator) paginator!: MatPaginator

  public isLoading = signal(true)
  public displayedColumns = [
    'Event',
    'Event Type',
    'timestamp'
  ]

  public isCloudMode: boolean = environment.cloud

  public dataSource = new MatTableDataSource<EventLog>([])
  public hasMoreRecords = false
  public pageSize = 10
  public currentPageIndex = 0

  constructor() {
    if (!this.isCloudMode) {
      this.displayedColumns = [
        'Event',
        'Source',
        'Severity',
        'timestamp'
      ]
    }
  }

  ngAfterViewInit(): void {
    if (this.isCloudMode) {
      this.isLoading.set(true)
      this.deviceLogService
        .getEventLog(this.deviceId)
        .pipe(
          catchError((err) => {
            this.snackBar.open($localize`Error retrieving event log`, undefined, SnackbarDefaults.defaultError)
            return of({ records: [], hasMoreRecords: true })
          }),
          finalize(() => {
            this.isLoading.set(false)
          })
        )
        .subscribe((data) => {
          this.dataSource.data = data.records
        })
    } else {
      this.loadEventLogs(0)
    }
  }

  loadEventLogs(startIndex: number): void {
    this.isLoading.set(true)
    this.deviceLogService
      .getEventLog(this.deviceId, startIndex, this.pageSize)
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error retrieving event log`, undefined, SnackbarDefaults.defaultError)
          return of({ records: [], hasMoreRecords: true })
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((data) => {
        this.hasMoreRecords = data.hasMoreRecords
        this.dataSource.data = data.records
      })
  }

  decodeEventType(eventType: number): string {
    return EVENTTYPEMAP[eventType]
  }

  nextPage(): void {
    this.loadEventLogs(++this.currentPageIndex * this.pageSize)
  }

  lastPage(): void {
    this.loadEventLogs(--this.currentPageIndex * this.pageSize)
  }

  isNoData(): boolean {
    return this.isLoading() || this.dataSource.data.length === 0
  }
  download(): void {
    this.isLoading.set(true)
    this.deviceLogService.downloadEventLog(this.deviceId).subscribe((data) => {
      const blob = new Blob([data], { type: 'application/octet-stream' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `event_${this.deviceId}.csv`
      a.click()

      window.URL.revokeObjectURL(url)
      this.isLoading.set(false)
    })
  }
}
