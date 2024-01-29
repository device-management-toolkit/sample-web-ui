/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { CIRAConfigResponse, PageEventOptions } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { ConfigsService } from './configs.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'

@Component({
  selector: 'app-configs',
  templateUrl: './configs.component.html',
  styleUrls: ['./configs.component.scss']
})
export class ConfigsComponent implements OnInit {
  public configs: CIRAConfigResponse = { data: [], totalCount: 0 }
  public isLoading = true
  displayedColumns: string[] = ['name', 'mpsserver', 'port', 'username', 'certname', 'rootcert', 'remove']
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public router: Router, private readonly configsService: ConfigsService) { }

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
    this.configsService.getData(pageEvent).pipe(
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe((data: CIRAConfigResponse) => {
      this.configs = data
    }, () => {
      this.snackBar.open($localize`Unable to load CIRA Configs`, undefined, SnackbarDefaults.defaultError)
    })
  }

  isNoData (): boolean {
    return !this.isLoading && this.configs.data.length === 0
  }

  delete (name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.configsService.delete(name).pipe(
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe(data => {
          this.getData(this.pageEvent)
          this.snackBar.open($localize`CIRA config deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        },
        err => {
          if (err?.length > 0) {
            this.snackBar.open(err as string, undefined, SnackbarDefaults.longError)
          } else {
            this.snackBar.open($localize`Unable to delete CIRA Config`, undefined, SnackbarDefaults.defaultError)
          }
        })
      }
    })
  }

  pageChanged (event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      pageSize: event.pageSize,
      startsFrom: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo (path: string = 'new'): Promise<void> {
    await this.router.navigate(['/ciraconfigs', encodeURIComponent(path)])
  }
}
