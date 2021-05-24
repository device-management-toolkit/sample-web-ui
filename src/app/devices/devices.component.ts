/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { SelectionModel } from '@angular/cdk/collections'
import { Component, OnInit } from '@angular/core'
import { MatSelectChange } from '@angular/material/select'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { BehaviorSubject, forkJoin, Observable, throwError } from 'rxjs'
import { catchError, finalize, mergeMap } from 'rxjs/operators'
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
  public tags: string[] = []
  public selectedTags = new BehaviorSubject<string[]>([])
  public selection: SelectionModel<Device>

  displayedColumns: string[] = ['select', 'hostname', 'guid', 'status', 'tags', 'actions']

  constructor (public snackBar: MatSnackBar, public readonly router: Router, private readonly devicesService: DevicesService) {
    const initialSelection: Device[] = []
    const allowMultiSelect = true
    this.selection = new SelectionModel<any>(allowMultiSelect, initialSelection)
  }

  ngOnInit (): void {
    const tags = this.devicesService.getTags()
    forkJoin({ tags }).pipe(
      catchError((err) => {
        this.snackBar.open($localize`Error loading devices`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      }), finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.tags = data.tags
      // this.isLoading = false
    })

    this.selectedTags.pipe(
      mergeMap(tags => {
        this.isLoading = true
        return this.devicesService.getDevices(tags)
      }),
      finalize(() => {
      })
    ).subscribe(devices => {
      this.devices = devices
      this.isLoading = false
    })
  }

  tagChange (event: MatSelectChange): void {
    this.selectedTags.next(event.value)
  }

  isAllSelected (): boolean {
    const numSelected = this.selection.selected.length
    const numRows = this.devices.length
    return numSelected === numRows
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle (): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.devices.forEach(row => this.selection.select(row))
  }

  isNoData (): boolean {
    return !this.isLoading && this.devices.length === 0
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${path}`])
  }

  translateConnectionStatus (status: boolean): string {
    switch (status) {
      case false:
        return 'disconnected'
      case true:
        return 'connected'
      default:
        return 'unknown'
    }
  }

  bulkPowerAction (action: number): void {
    const requests: Array<Observable<any>> = []
    this.selection.selected.forEach(z => {
      requests.push(this.devicesService.sendPowerAction(z.guid, action))
    })

    forkJoin(requests).subscribe(result => {
      this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
    })
  }

  sendPowerAction (deviceId: string, action: number): void {
    this.isLoading = true
    this.devicesService.sendPowerAction(deviceId, action).pipe(
      catchError(err => {
        // TODO: handle error better
        this.snackBar.open($localize`Error sending power action`, undefined, SnackbarDefaults.defaultError)
        return throwError(err)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.snackBar.open($localize`Power action sent successfully`, undefined, SnackbarDefaults.defaultSuccess)
      console.log(data)
    })
  }
}
