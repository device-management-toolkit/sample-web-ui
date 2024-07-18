/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, Input, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { catchError, finalize, take } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { EventLog } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { MomentModule } from 'ngx-moment'
import { MatCard, MatCardContent } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatToolbar } from '@angular/material/toolbar'
import { environment } from 'src/environments/environment'

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
  standalone: true,
  imports: [
    MatToolbar,
    MatProgressBar,
    MatCard,
    MatCardContent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MomentModule
  ]
})
export class EventLogComponent implements OnInit {
  @Input()
  public deviceId = ''

  public isLoading = true
  public displayedColumns = [
    'Event',
    'Event Type',
    'timestamp'
  ]

  public eventLogData: EventLog[] = []
  public isCloudMode: boolean = environment.cloud
  public dataSource = new MatTableDataSource(this.eventLogData)
  constructor(
    public snackBar: MatSnackBar,
    public readonly activatedRoute: ActivatedRoute,
    private readonly devicesService: DevicesService
  ) {
    if (!this.isCloudMode) {
      this.displayedColumns = [
        'Event',
        'Source',
        'Severity',
        'timestamp'
      ]
    }
  }

  ngOnInit(): void {
    this.activatedRoute.params.pipe(take(1)).subscribe((params) => {
      this.isLoading = true
      this.deviceId = params.id
      this.devicesService
        .getEventLog(this.deviceId)
        .pipe(
          catchError((err) => {
            console.error(err)
            this.snackBar.open($localize`Error retrieving event log`, undefined, SnackbarDefaults.defaultError)
            return of(this.eventLogData)
          }),
          finalize(() => {
            this.isLoading = false
          })
        )
        .subscribe((data) => {
          this.eventLogData = data || []
          this.dataSource.data = this.eventLogData
        })
    })
  }

  decodeEventType(eventType: number): string {
    return EVENTTYPEMAP[eventType]
  }

  isNoData(): boolean {
    return this.isLoading || this.eventLogData?.length === 0
  }
}
