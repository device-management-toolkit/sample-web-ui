/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'

import { finalize } from 'rxjs/operators'
import { DomainsResponse, PageEventOptions } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DomainsService } from './domains.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
@Component({
  selector: 'app-domains',
  templateUrl: './domains.component.html',
  styleUrls: ['./domains.component.scss']
})

export class DomainsComponent implements OnInit {
  public domains: DomainsResponse = { data: [], totalCount: 0 }
  public isLoading = true
  displayedColumns: string[] = ['name', 'domainSuffix', 'remove']
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public router: Router, private readonly domainsService: DomainsService) { }

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
    this.domainsService.getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      ).subscribe((data: DomainsResponse) => {
        this.domains = data
      }, () => {
        this.snackBar.open($localize`Unable to load domains`, undefined, SnackbarDefaults.defaultError)
      })
  }

  isNoData (): boolean {
    return !this.isLoading && this.domains.data.length === 0
  }

  delete (name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.domainsService.delete(name).pipe(
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe(data => {
          this.getData(this.pageEvent)
          this.snackBar.open($localize`Domain deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        },
        () => {
          this.snackBar.open($localize`Unable to delete domain`, undefined, SnackbarDefaults.defaultError)
        })
      }
    })
  }

  pageChanged (event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      startsFrom: event.pageIndex * event.pageSize,
      pageSize: event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo (path: string = 'new'): Promise<void> {
    await this.router.navigate([`/domains/${path}`])
  }
}
