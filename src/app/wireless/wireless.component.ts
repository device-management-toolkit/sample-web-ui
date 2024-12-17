/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, ViewChild, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { PageEventOptions, WirelessConfig } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { WirelessService } from './wireless.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { AuthenticationMethods, EncryptionMethods } from './wireless.constants'
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
  MatRow
} from '@angular/material/table'
import { MatCard, MatCardContent } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatToolbar } from '@angular/material/toolbar'
import { ToolkitPipe } from '../shared/pipes/toolkit.pipe'

@Component({
  selector: 'app-wireless',
  templateUrl: './wireless.component.html',
  styleUrls: ['./wireless.component.scss'],
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
export class WirelessComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  readonly wirelessService = inject(WirelessService)
  router = inject(Router)
  dialog = inject(MatDialog)

  configs: WirelessConfig[] = []
  isLoading = true
  totalCount = 0
  displayedColumns: string[] = [
    'name',
    'authmethod',
    'encryptionMethod',
    'ssid',
    'remove'
  ]
  authenticationMethods = AuthenticationMethods
  encryptionMethods = EncryptionMethods
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  getData(pageEvent: PageEventOptions): void {
    this.wirelessService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: (rsp) => {
          this.configs = rsp.data
          this.totalCount = rsp.totalCount
        },
        error: () => {
          this.snackBar.open($localize`Unable to load configurations`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading && this.configs.length === 0
  }

  delete(name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading = true
        this.wirelessService
          .delete(name)
          .pipe(
            finalize(() => {
              this.isLoading = false
            })
          )
          .subscribe({
            next: (data) => {
              this.getData(this.pageEvent)
              this.snackBar.open(
                $localize`Configuration deleted successfully`,
                undefined,
                SnackbarDefaults.defaultSuccess
              )
            },
            error: (err) => {
              if (err?.length > 0) {
                this.snackBar.open(err as string, undefined, SnackbarDefaults.longError)
              } else {
                this.snackBar.open($localize`Unable to delete configuration`, undefined, SnackbarDefaults.defaultError)
              }
            }
          })
      }
    })
  }

  pageChanged(event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      pageSize: event.pageSize,
      startsFrom: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo(path = 'new'): Promise<void> {
    await this.router.navigate([`/wireless/${path}`])
  }
}
