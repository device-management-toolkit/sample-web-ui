/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatTableDataSource } from '@angular/material/table'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import Constants from 'src/app/shared/config/Constants'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { EventLog } from 'src/models/models'
import { DevicesService } from '../devices.service'

@Component({
  selector: 'app-event-log',
  templateUrl: './event-log.component.html',
  styleUrls: ['./event-log.component.scss']
})
export class EventLogComponent implements OnInit {
  public isLoading = true
  public deviceId: string = ''
  public displayedColumns = ['Event', 'Event Type', 'timestamp']

  public eventLogData: EventLog[] = []

  public dataSource = new MatTableDataSource(this.eventLogData)
  constructor (
    public snackBar: MatSnackBar,
    public readonly activatedRoute: ActivatedRoute,
    private readonly devicesService: DevicesService) {}

  ngOnInit (): void {
    this.activatedRoute.params.subscribe(params => {
      this.isLoading = true
      this.deviceId = params.id
      this.devicesService.getEventLog(this.deviceId).pipe(
        catchError(err => {
          console.log(err)
          this.snackBar.open($localize`Error retrieving event log`, undefined, SnackbarDefaults.defaultError)
          return of(this.eventLogData)
        }), finalize(() => {
          this.isLoading = false
        })
      ).subscribe(data => {
        this.eventLogData = data || []
        this.dataSource.data = this.eventLogData
      })
    })
  }

  decodeEventType (eventType: number): string {
    return Constants.EVENTTYPEMAP[eventType]
  }

  isNoData (): boolean {
    return this.isLoading || this.eventLogData?.length === 0
  }
}
