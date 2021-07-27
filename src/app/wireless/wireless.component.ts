import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { finalize } from 'rxjs/operators'
import { WirelessConfig } from 'src/models/models'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { WirelessService } from './wireless.service'

@Component({
  selector: 'app-wireless',
  templateUrl: './wireless.component.html',
  styleUrls: ['./wireless.component.scss']
})
export class WirelessComponent implements OnInit {
  public wirelessConfigs: WirelessConfig[] = []
  public isLoading = true
  displayedColumns: string[] = ['name', 'authmethod', 'encryptionMethod', 'ssid', 'remove']
  constructor (public snackBar: MatSnackBar, public readonly wirelessService: WirelessService, public router: Router, public dialog: MatDialog) { }

  ngOnInit (): void {
    this.getData()
  }

  getData (): void {
    this.wirelessService.getData().pipe(
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.wirelessConfigs = data
    }, () => {
      this.snackBar.open($localize`Unable to load Wireless Configs`, undefined, SnackbarDefaults.defaultError)
    })
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
          this.getData()
          this.snackBar.open($localize`Profile deleted successfully`, undefined, SnackbarDefaults.defaultSuccess)
        }, () => {
          this.snackBar.open($localize`Unable to delete profile`, undefined, SnackbarDefaults.defaultError)
        })
      }
    })
  }

  async navigateTo (path: string = 'new'): Promise<void> {
    await this.router.navigate([`/wireless/${path}`])
  }
}
