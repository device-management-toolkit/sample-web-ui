/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, ViewChild, inject, signal } from '@angular/core'
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
  MatRow,
  MatTableDataSource
} from '@angular/material/table'
import { MatCard, MatCardContent } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatIcon } from '@angular/material/icon'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatToolbar } from '@angular/material/toolbar'
import { ToolkitPipe } from '../shared/pipes/toolkit.pipe'
import { environment } from 'src/environments/environment'
import { KeyDisplayDialogComponent } from './key-display-dialog/key-display-dialog.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ExportDialogComponent } from './export-dialog/export-dialog.component'

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
    MatPaginator,
    TranslateModule
  ]
})
export class ProfilesComponent implements OnInit {
  // Dependency Injection
  private readonly dialog = inject(MatDialog)
  private readonly profilesService = inject(ProfilesService)
  public readonly snackBar = inject(MatSnackBar)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)

  public profiles = new MatTableDataSource<Profile>()
  public readonly isLoading = signal(true)
  public totalCount = signal(0)
  public readonly tlsModes = TlsModes
  public readonly displayedColumns: string[] = [
    'name',
    'networkConfig',
    'connectionConfig',
    'activation',
    'remove'
  ]
  public pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }
  public readonly cloudMode = environment.cloud

  @ViewChild(MatPaginator) paginator!: MatPaginator

  ngOnInit(): void {
    this.getData(this.pageEvent)
  }

  getData(pageEvent: PageEventOptions): void {
    this.profilesService
      .getData(pageEvent)
      .pipe(
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (rsp) => {
          this.profiles = new MatTableDataSource<Profile>(rsp.data)
          this.totalCount.set(rsp.totalCount)
        },
        error: () => {
          const msg: string = this.translate.instant('profiles.failLoadConfiguration.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
        }
      })
  }

  isNoData(): boolean {
    return !this.isLoading() && this.totalCount() === 0
  }

  export(name: string): void {
    const profile = this.profiles.data.find((p) => p.profileName === name)
    if (!profile) {
      const msg: string = this.translate.instant('profiles.failExportProfile.value')

      this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
      return
    }

    if (profile.activation === 'acmactivate') {
      const dialogRef = this.dialog.open(ExportDialogComponent, {
        width: '400px',
        disableClose: false
      })

      dialogRef.afterClosed().subscribe((selectedDomain) => {
        if (selectedDomain) {
          this.exportProfile(name, selectedDomain !== 'none' ? selectedDomain : '')
        }
      })
    } else {
      this.exportProfile(name, '')
    }
  }

  private exportProfile(name: string, domain: string): void {
    this.profilesService.export(name, domain).subscribe({
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
        const msg: string = this.translate.instant('profiles.exportProfile.value')

        this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
      },
      error: () => {
        const msg: string = this.translate.instant('profiles.failExportProfile.value')

        this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
      }
    })
  }

  delete(name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading.set(true)
        this.profilesService
          .delete(name)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: () => {
              this.getData(this.pageEvent)
              const msg: string = this.translate.instant('profiles.deleteProfile.value')

              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultSuccess)
            },
            error: (err) => {
              if (err?.length > 0) {
                this.snackBar.open(err as string, undefined, SnackbarDefaults.longError)
              } else {
                const msg: string = this.translate.instant('profiles.failDeleteProfie.value')

                this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
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
