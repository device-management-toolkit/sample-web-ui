/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { PageEventOptions } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { IEEE8021xService } from './ieee8021x.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { AuthenticationProtocols, ConfigsResponse } from './ieee8021x.constants'

@Component({
  selector: 'app-ieee8021x',
  templateUrl: './ieee8021x.component.html',
  styleUrls: ['./ieee8021x.component.scss']
})
export class IEEE8021xComponent implements OnInit {
  pagedConfigs: ConfigsResponse = {
    data: [],
    totalCount: 0
  }

  protocols = AuthenticationProtocols
  isLoading = true
  displayedColumns: string[] = ['profileName', 'authenticationProtocol', 'interface', 'remove']
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (
    public snackBar: MatSnackBar,
    public readonly ieee8021xService: IEEE8021xService,
    public router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
    this.ieee8021xService
      .getData(pageEvent)
      .pipe(finalize(() => { this.isLoading = false }))
      .subscribe({
        next: (pagedConfigs: ConfigsResponse) => {
          this.pagedConfigs = pagedConfigs
        },
        error: () => {
          this.snackBar.open($localize`Unable to load IEEE8021x Configs`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData (): boolean {
    return !this.isLoading && this.pagedConfigs.data.length === 0
  }

  delete (name: string): void {
    this.dialog
      .open(AreYouSureDialogComponent)
      .afterClosed()
      .subscribe(result => {
        if (result === true) {
          this.isLoading = true
          this.ieee8021xService
            .delete(name)
            .pipe(finalize(() => { this.isLoading = false }))
            .subscribe({
              next: () => {
                this.getData(this.pageEvent)
                this.snackBar.open($localize`Configuration deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
              },
              error: error => {
                if (error?.length > 0) {
                  this.snackBar.open(error, undefined, SnackbarDefaults.longError)
                } else {
                  this.snackBar.open($localize`Unable to delete Configuration`, undefined, SnackbarDefaults.defaultError)
                }
              }
            })
        }
      })
  }

  onPaginator (event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      pageSize: event.pageSize,
      startsFrom: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo (path: string = 'new'): Promise<void> {
    await this.router.navigate([`/ieee8021x/${path}`])
  }
}
