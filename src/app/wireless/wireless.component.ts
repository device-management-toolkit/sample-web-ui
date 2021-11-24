import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { PageEventOptions, WirelessConfigResponse } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { WirelessService } from './wireless.service'
import { MatPaginator, PageEvent } from '@angular/material/paginator'

@Component({
  selector: 'app-wireless',
  templateUrl: './wireless.component.html',
  styleUrls: ['./wireless.component.scss']
})
export class WirelessComponent implements OnInit {
  public wirelessConfigs: WirelessConfigResponse = { data: [], totalCount: 0 }
  public isLoading = true
  displayedColumns: string[] = ['name', 'authmethod', 'encryptionMethod', 'ssid', 'remove']
  pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (public snackBar: MatSnackBar, public readonly wirelessService: WirelessService, public router: Router, public dialog: MatDialog) { }

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
    this.wirelessService.getData(pageEvent).pipe(
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe((data: WirelessConfigResponse) => {
      this.wirelessConfigs = data
    }, () => {
      this.snackBar.open($localize`Unable to load Wireless Configs`, undefined, SnackbarDefaults.defaultError)
    })
  }

  isNoData (): boolean {
    return !this.isLoading && this.wirelessConfigs.data.length === 0
  }

  delete (name: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.wirelessService.delete(name).pipe(
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe(data => {
          this.getData(this.pageEvent)
          this.snackBar.open($localize`Profile deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        }, error => {
          if (error?.length > 0) {
            this.snackBar.open(error, undefined, SnackbarDefaults.longError)
          } else {
            this.snackBar.open($localize`Unable to delete profile`, undefined, SnackbarDefaults.defaultError)
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
    await this.router.navigate([`/wireless/${path}`])
  }
}
