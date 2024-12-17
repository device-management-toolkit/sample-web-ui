/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, ViewChild, inject } from '@angular/core'
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
import { environment } from 'src/environments/environment'
import { KeyDisplayDialogComponent } from './key-display-dialog/key-display-dialog.component'

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss'],
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
export class ProfilesComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  dialog = inject(MatDialog)
  readonly router = inject(Router)
  private readonly profilesService = inject(ProfilesService)

  profiles: Profile[] = []
  isLoading = true
  totalCount = 0
  tlsModes = TlsModes
  displayedColumns: string[] = [
    'name',
    'networkConfig',
    'connectionConfig',
    'activation',
    'remove'
  ]
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }
  cloudMode = environment.cloud

  @ViewChild(MatPaginator) paginator!: MatPaginator

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  getData(pageEvent: PageEventOptions): void {
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

  isNoData(): boolean {
    return !this.isLoading && this.profiles.length === 0
  }

  export(name: string): void {
    this.profilesService.export(name).subscribe({
      next: (data) => {
        // prompt to download data
        const blob = new Blob([data.content], { type: 'application/x-yaml' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${name}.yaml`
        a.click()
        window.URL.revokeObjectURL(url)
        this.dialog.open(KeyDisplayDialogComponent, { data: { key: data.key } })
        this.snackBar.open($localize`Profile exported successfully`, undefined, SnackbarDefaults.defaultSuccess)
      },
      error: () => {
        this.snackBar.open($localize`Unable to export profile`, undefined, SnackbarDefaults.defaultError)
      }
    })
  }

  delete(name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe((result) => {
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
            error: (err) => {
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

  pageChanged(event: PageEvent): void {
    this.pageEvent = {
      ...this.pageEvent,
      pageSize: event.pageSize,
      startsFrom: event.pageIndex * event.pageSize
    }
    this.getData(this.pageEvent)
  }

  async navigateTo(path = 'new'): Promise<void> {
    await this.router.navigate(['/profiles', encodeURIComponent(path)])
  }
}
