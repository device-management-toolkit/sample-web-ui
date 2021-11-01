/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { PageEventOptions, ProfileResponse, TlsMode } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { ProfilesService } from './profiles.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})

export class ProfilesComponent implements OnInit {
  public profiles: ProfileResponse = { data: [], totalCount: 0 }
  public tlsModes: TlsMode[] = []
  public isLoading = true
  displayedColumns: string[] = ['name', 'networkConfig', 'connectionConfig', 'activation', 'remove']
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public readonly router: Router, private readonly profilesService: ProfilesService) {
    this.tlsModes = profilesService.tlsModes
  }

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
    this.profilesService.getData(pageEvent).pipe(
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe((data) => {
      this.profiles = data
    }, () => {
      this.snackBar.open($localize`Unable to load profiles`, undefined, SnackbarDefaults.defaultError)
    })
  }

  isNoData (): boolean {
    return !this.isLoading && this.profiles.data.length === 0
  }

  delete (name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.profilesService.delete(name).pipe(
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe(data => {
          this.getData(this.pageEvent)
          this.snackBar.open($localize`Profile deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        },
        () => {
          this.snackBar.open($localize`Unable to delete profile`, undefined, SnackbarDefaults.defaultError)
        })
      }
    })
  }

  parseTlsMode (val: Number): string {
    return this.tlsModes.find(z => z.value === val)?.viewValue ?? ''
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
    await this.router.navigate([`/profiles/${path}`])
  }
}
