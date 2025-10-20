/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, ViewChild, inject, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { IEEE8021xConfig, PageEventOptions } from 'src/models/models'
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
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-ieee8021x',
  templateUrl: './ieee8021x.component.html',
  styleUrls: ['./ieee8021x.component.scss'],
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
    MatPaginator,
    TranslateModule
  ]
})
export class IEEE8021xComponent implements OnInit {
  // Dependency Injection
  private readonly ieee8021xService = inject(IEEE8021xService)
  private readonly dialog = inject(MatDialog)
  public readonly snackBar = inject(MatSnackBar)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)

  public tableDataSource = new MatTableDataSource<IEEE8021xConfig>()
  public displayedColumns: string[] = [
    'profileName',
    'authenticationProtocol',
    'interface',
    'remove'
  ]
  public totalCount = signal(0)
  public pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }
  public protocols = AuthenticationProtocols
  public isLoading = signal(true)

  @ViewChild(MatPaginator) public paginator!: MatPaginator

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  getData(pageEvent: PageEventOptions): void {
    this.ieee8021xService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (pagedConfigs) => {
          this.tableDataSource = new MatTableDataSource(pagedConfigs.data)
          this.totalCount.set(pagedConfigs.totalCount)
        },
        error: () => {
          const msg: string = this.translate.instant('ieee.failLoadConfigs.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading() && this.totalCount() === 0
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
                const deleteMessage: string = this.translate.instant('common.deleteProfile.value')
                this.snackBar.open(deleteMessage, undefined, SnackbarDefaults.defaultSuccess)
              },
              error: (error) => {
                if (error?.length > 0) {
                  this.snackBar.open(error as string, undefined, SnackbarDefaults.longError)
                } else {
                  const errorMessage: string = this.translate.instant('common.errorDeleteConfiguration.value')
                  this.snackBar.open(errorMessage, undefined, SnackbarDefaults.defaultError)
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
      startsFrom: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo(path = 'new'): Promise<void> {
    await this.router.navigate([`/ieee8021x/${path}`])
  }

  public getInterfaceLabel(element: any): string {
    return element.wiredInterface
      ? this.translate.instant('common.wired.value')
      : this.translate.instant('common.wireless.value')
  }
}
