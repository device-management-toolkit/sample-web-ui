/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
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
import { MatTooltipModule } from '@angular/material/tooltip'
import { Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { finalize } from 'rxjs/operators'
import { PageEventOptions, ProxyConfig } from 'src/models/models'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import { ProxyConfigsService } from './proxy-configs.service'

@Component({
  selector: 'app-proxy-configs',
  templateUrl: './proxy-configs.component.html',
  styleUrl: './proxy-configs.component.scss',
  imports: [
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
    MatTooltipModule,
    TranslateModule
  ]
})
export class ProxyConfigsComponent implements OnInit, AfterViewInit {
  public readonly router = inject(Router)
  public readonly snackBar = inject(MatSnackBar)
  private readonly proxyConfigsService = inject(ProxyConfigsService)
  private readonly dialog = inject(MatDialog)

  public configs = new MatTableDataSource<ProxyConfig>()
  public displayedColumns: string[] = [
    'name',
    'address',
    'port',
    'networkDnsSuffix',
    'remove'
  ]
  public totalCount = signal(0)
  public isLoading = signal(true)
  public pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  ngAfterViewInit(): void {
    this.configs.paginator = this.paginator
  }

  getData(pageEvent: PageEventOptions): void {
    this.proxyConfigsService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (data) => {
          this.configs.data = data.data
          this.totalCount.set(data.totalCount)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading() && this.configs.data.length === 0
  }

  pageChanged(event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      pageSize: event.pageSize,
      startsFrom: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  delete(name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent, {
      data: { name }
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading.set(true)
        this.proxyConfigsService
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
            error: (err) => {
              if (err?.error?.message) {
                this.snackBar.open(err.error.message as string, undefined, SnackbarDefaults.longError)
              } else {
                this.snackBar.open($localize`Unable to delete configuration`, undefined, SnackbarDefaults.defaultError)
              }
            }
          })
      }
    })
  }

  async navigateTo(path = 'new'): Promise<void> {
    await this.router.navigate([`/proxy-configs/${path}`])
  }

  encodeURIComponent(value: string): string {
    return encodeURIComponent(value)
  }
}
