/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { Profile } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { ProfilesService } from './profiles.service'

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {
  public profiles: Profile[] = []
  public isLoading = true

  displayedColumns: string[] = ['name', 'networkConfig', 'ciraConfig', 'activation', 'remove']

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public readonly router: Router, private readonly profilesService: ProfilesService) { }

  ngOnInit (): void {
    this.getData()
  }

  getData (): void {
    this.profilesService.getData().pipe(
      catchError(() => {
        return of([])
      }), finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.profiles = data
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
        this.profilesService.delete(name).pipe(
          catchError(err => {
            this.snackBar.open($localize`Error deleting profile`, undefined, SnackbarDefaults.defaultError)
            return throwError(err)
          }),
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe(data => {
          this.getData()
          this.snackBar.open($localize`Profile deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        })
      }
    })
  }

  async navigateTo (path: string = 'new'): Promise<void> {
    await this.router.navigate([`/profiles/${path}`])
  }
}
