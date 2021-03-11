/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { CIRAConfig } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { ConfigsService } from './configs.service'

@Component({
  selector: 'app-configs',
  templateUrl: './configs.component.html',
  styleUrls: ['./configs.component.scss']
})
export class ConfigsComponent implements OnInit {
  public configs: CIRAConfig[] = []
  public isLoading = true
  public errorMessages: string[] = []
  displayedColumns: string[] = ['name', 'mpsserver', 'port', 'username', 'certname', 'rootcert', 'remove']

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public router: Router, private readonly configsService: ConfigsService) { }

  ngOnInit (): void {
    this.getData()
  }

  getData (): void {
    this.configsService.getData().pipe(
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.configs = data
    }, error => {
      this.errorMessages = error
    })
  }

  isNoData (): boolean {
    return !this.isLoading && this.configs.length === 0
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
          this.getData()
          this.snackBar.open($localize`CIRA config deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        },
        error => {
          this.errorMessages = error
        })
      }
    })
  }

  async navigateTo (path: string = 'new'): Promise<void> {
    await this.router.navigate([`/ciraconfigs/${path}`])
  }
}
