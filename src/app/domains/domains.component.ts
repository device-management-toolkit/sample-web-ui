/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, ViewChild, inject, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'

import { finalize } from 'rxjs/operators'
import { DataWithCount, Domain, PageEventOptions } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DomainsService } from './domains.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { DatePipe } from '@angular/common'
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
import { TranslateModule } from '@ngx-translate/core'
@Component({
  selector: 'app-domains',
  templateUrl: './domains.component.html',
  styleUrls: ['./domains.component.scss'],
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
    DatePipe,
    TranslateModule
  ]
})
export class DomainsComponent implements OnInit {
  // Dependency Injection
  private readonly domainsService = inject(DomainsService)
  private readonly dialog = inject(MatDialog)
  public readonly router = inject(Router)
  public readonly snackBar = inject(MatSnackBar)

  // ViewChild
  @ViewChild(MatPaginator) paginator!: MatPaginator

  // Public properties
  public domains = new MatTableDataSource<Domain>()
  public totalCount = signal(0)
  public isLoading = signal(true)
  public myDate = ''
  public displayedColumns: string[] = [
    'name',
    'domainSuffix',
    'expirationDate',
    'remove'
  ]
  public pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  // Private constants
  private readonly millisecondsInADay = 86400000
  private readonly warningPeriodInDays = 60

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  getData(pageEvent: PageEventOptions): void {
    this.domainsService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (data: DataWithCount<Domain>) => {
          this.domains = new MatTableDataSource<Domain>(data.data)
          this.totalCount.set(data.totalCount)
          this.expirationWarning()
        },
        error: () => {
          this.snackBar.open($localize`Unable to load domains`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading() && this.totalCount() === 0
  }

  delete(name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading.set(true)
        this.domainsService
          .delete(name)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: () => {
              this.getData(this.pageEvent)
              this.snackBar.open($localize`Domain deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
            },
            error: () => {
              this.snackBar.open($localize`Unable to delete domain`, undefined, SnackbarDefaults.defaultError)
            }
          })
      }
    })
  }

  pageChanged(event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      startsFrom: event.pageIndex * event.pageSize,
      pageSize: event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo(path = 'new'): Promise<void> {
    await this.router.navigate([`/domains/${path}`])
  }

  getRemainingTime(expirationDate: Date): string {
    const today = new Date()
    const expDate = new Date(expirationDate)

    if (expDate < today) {
      return $localize`Expired`
    }

    const daysRemaining = Math.trunc((expDate.getTime() - today.getTime()) / this.millisecondsInADay)

    if (daysRemaining <= 60) {
      return daysRemaining.toString() + $localize` days remaining`
    } else if (daysRemaining < 730) {
      return Math.trunc(daysRemaining / 30).toString() + $localize` months remaining`
    } else {
      return Math.trunc(daysRemaining / 365).toString() + $localize` years remaining`
    }
  }

  expirationWarning(): void {
    let countWarn = 0
    let countExp = 0
    const today = new Date()

    for (const domain of this.domains.data) {
      const expDate = new Date(domain.expirationDate)
      if (expDate < today) {
        countExp++
      } else if ((expDate.getTime() - today.getTime()) / this.millisecondsInADay < this.warningPeriodInDays) {
        countWarn++
      }
    }

    let message = ''
    if (countWarn > 0) {
      message += $localize`${countWarn.toString()} domain cert(s) will expire soon `
    }
    if (countExp > 0) {
      message += $localize`${countExp.toString()} domain cert(s) are expired `
    }

    if (message !== '') {
      this.snackBar.open(message, undefined, SnackbarDefaults.longError)
    }
  }
}
