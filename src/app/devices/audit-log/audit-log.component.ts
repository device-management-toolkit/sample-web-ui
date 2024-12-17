/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AfterViewInit, Component, Input, OnInit, signal, ViewChild, inject } from '@angular/core'
import { PageEvent, MatPaginator } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatSort, MatSortHeader } from '@angular/material/sort'
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
import { Router } from '@angular/router'
import { merge, of } from 'rxjs'
import { catchError, startWith, switchMap } from 'rxjs/operators'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AuditLogResponse, Device } from 'src/models/models'
import { DevicesService } from '../devices.service'
import { MomentModule } from 'ngx-moment'
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  imports: [
    MatProgressBar,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatSortHeader,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    MomentModule
  ]
})
export class AuditLogComponent implements AfterViewInit {
  snackBar = inject(MatSnackBar)
  readonly router = inject(Router)
  private readonly devicesService = inject(DevicesService)

  @Input()
  public deviceId = ''

  public devices: Device[] = []
  public isLoading = signal(true)
  public displayedColumns = ['Event', 'timestamp']
  public auditLogData: AuditLogResponse = { totalCnt: 0, records: [] }
  public isCloudMode: boolean = environment.cloud
  public pageSizes = [
    120
  ]
  @ViewChild(MatSort) sort!: MatSort
  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor() {
    if (!this.isCloudMode) {
      this.displayedColumns = [
        'Event',
        'Description',
        'timestamp'
      ]
    }
  }
  ngAfterViewInit(): void {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0))
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          return this.devicesService
            .getAuditLog(this.deviceId, (this.paginator?.pageSize ?? 120) * (this.paginator?.pageIndex ?? 0) + 1)
            .pipe(catchError(() => of(null)))
        }),
        catchError((err) => {
          console.error(err)
          this.snackBar.open($localize`Error retrieving audit log`, undefined, SnackbarDefaults.defaultError)
          return of(this.auditLogData)
        })
      )
      .subscribe({
        next: (data) => {
          this.auditLogData = data ?? { totalCnt: 0, records: [] }
          this.isLoading.set(false)
        },
        error: (err) => {
          console.error(err)
          this.isLoading.set(false)
          this.snackBar.open($localize`Error retrieving audit log`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading() && this.auditLogData.records.length === 0
  }

  async navigateTo(path: string): Promise<void> {
    await this.router.navigate([`/devices/${path}`])
  }
}
