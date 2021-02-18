/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, OnInit } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'
import { Device } from 'src/models/models'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DevicesService } from './devices.service'

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit {
  public devices: Device[] = []
  public isLoading = true

  displayedColumns: string[] = ['select', 'host', 'status']

  constructor (public snackBar: MatSnackBar, public readonly router: Router, private readonly devicesService: DevicesService) { }

  ngOnInit (): void {
    this.devicesService.getData().pipe(
      catchError(() => {
        this.snackBar.open($localize`Error loading devices`, undefined, SnackbarDefaults.defaultError)
        return of([])
      }), finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.devices = data
      // this.isLoading = false
    })
  }

  isNoData (): boolean {
    return !this.isLoading && this.devices.length === 0
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${path}`])
  }

  translateConnectionStatus (status: number): string {
    switch (status) {
      case 0:
        return 'disconnected'
      case 1:
        return 'connected'
      default:
        return 'unknown'
    }
  }
}
