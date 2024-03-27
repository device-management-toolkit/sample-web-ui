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
import { ProfilesService } from './profiles.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { Profile, TlsModes } from './profiles.constants'

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})

export class ProfilesComponent implements OnInit {
  profiles: Profile[] = []
  isLoading = true
  tlsModes = TlsModes
  totalCount: number = 0
  displayedColumns: string[] = ['name', 'networkConfig', 'connectionConfig', 'activation', 'remove']
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (
    public snackBar: MatSnackBar,
    public dialog: MatDialog,
    public readonly router: Router,
    private readonly profilesService: ProfilesService) {}

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
    this.profilesService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: (rsp) => {
          this.profiles = rsp.data
          this.totalCount = rsp.totalCount
        },
        error: () => {
          this.snackBar.open($localize`Unable to load configurations`, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData (): boolean {
    return !this.isLoading && this.profiles.length === 0
  }

  delete (name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.profilesService
          .delete(name)
          .pipe(
            finalize(() => {
              this.isLoading = false
            })
          )
          .subscribe({
             next: () => {
              this.getData(this.pageEvent)
              this.snackBar.open($localize`Profile deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
            },
            error: err => {
              if (err?.length > 0) {
                this.snackBar.open(err as string, undefined, SnackbarDefaults.longError)
              } else {
                this.snackBar.open($localize`Unable to delete profile`, undefined, SnackbarDefaults.defaultError)
              }
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
    await this.router.navigate(['/profiles', encodeURIComponent(path)])
  }
}
