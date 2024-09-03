/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { DataWithCount, IEEE8021xConfig } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { IEEE8021xService } from './ieee8021x.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { AuthenticationProtocols } from './ieee8021x.constants'
import {
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
  MatTableDataSource
} from '@angular/material/table'
import { MatCard, MatCardContent } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatToolbar } from '@angular/material/toolbar'
import { ToolkitPipe } from '../shared/pipes/toolkit.pipe'

@Component({
  selector: 'app-ieee8021x',
  templateUrl: './ieee8021x.component.html',
  styleUrls: ['./ieee8021x.component.scss'],
  standalone: true,
  imports: [
    ToolkitPipe,
    MatToolbar,
    MatButton,
    MatIcon,
    MatProgressBar,
    MatCard,
    MatCardContent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator
  ]
})
export class IEEE8021xComponent implements OnInit {
  pagedConfigs: DataWithCount<IEEE8021xConfig> = {
    data: [],
    totalCount: 0
  }
  dataSource = new MatTableDataSource<IEEE8021xConfig>([])

  protocols = AuthenticationProtocols
  isLoading = signal(true)
  displayedColumns: string[] = [
    'profileName',
    'authenticationProtocol',
    'interface',
    'remove'
  ]
  pageEvent: PageEvent = {
    pageSize: 25,
    pageIndex: 0,
    length: 0
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor(
    public snackBar: MatSnackBar,
    public readonly ieee8021xService: IEEE8021xService,
    public router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  getData(pageEvent: PageEvent): void {
    this.ieee8021xService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (pagedConfigs) => {
          this.pagedConfigs = pagedConfigs
          this.dataSource.data = pagedConfigs.data
          this.paginator.length = pagedConfigs.totalCount
        },
        error: () => {
          this.snackBar.open($localize`Unable to load IEEE8021x Configs`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading() && this.pagedConfigs.data.length === 0
  }

  delete(name: string): void {
    this.dialog
      .open(AreYouSureDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result === true) {
          this.isLoading.set(true)
          this.ieee8021xService
            .delete(name)
            .pipe(
              finalize(() => {
                this.isLoading.set(false)
              })
            )
            .subscribe({
              next: () => {
                this.getData(this.pageEvent)
                this.snackBar.open(
                  $localize`Configuration deleted successfully`,
                  undefined,
                  SnackbarDefaults.defaultSuccess
                )
              },
              error: (error) => {
                if (error?.length > 0) {
                  this.snackBar.open(error as string, undefined, SnackbarDefaults.longError)
                } else {
                  this.snackBar.open(
                    $localize`Unable to delete Configuration`,
                    undefined,
                    SnackbarDefaults.defaultError
                  )
                }
              }
            })
        }
      })
  }

  onPaginator(event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      pageSize: event.pageSize,
      pageIndex: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo(path = 'new'): Promise<void> {
    await this.router.navigate([`/ieee8021x/${path}`])
  }
}
