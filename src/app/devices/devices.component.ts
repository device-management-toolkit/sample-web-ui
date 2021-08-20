/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { SelectionModel } from '@angular/cdk/collections'
import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatSelectChange } from '@angular/material/select'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { BehaviorSubject, forkJoin, from, Observable, throwError } from 'rxjs'
import { catchError, delay, finalize, map, mergeMap } from 'rxjs/operators'
import { Device, DeviceResponse, PageEventOptions } from 'src/models/models'
import { AddDeviceComponent } from '../shared/add-device/add-device.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DevicesService } from './devices.service'

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit {
  public devices: DeviceResponse = { data: [], totalCount: 0 }
  public isLoading = true
  public tags: string[] = []
  public selectedTags = new BehaviorSubject<string[]>([])
  public selection: SelectionModel<Device>
  public powerStates: any
  displayedColumns: string[] = ['select', 'hostname', 'guid', 'status', 'tags', 'actions']
  pageEvent: PageEventOptions = {
    pageSize: 5,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public readonly router: Router, private readonly devicesService: DevicesService) {
    const initialSelection: Device[] = []
    const allowMultiSelect = true
    this.selection = new SelectionModel<any>(allowMultiSelect, initialSelection)
    this.powerStates = this.devicesService.PowerStates
  }

  ngOnInit (): void {
    this.getData(this.pageEvent)
  }

  getData (pageEvent: PageEventOptions): void {
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
        return this.devicesService.getDevices({ ...pageEvent, tags })
      })
    ).subscribe(devices => {
      this.devices = devices
      const deviceIds = this.devices.data.filter(z => z.connectionStatus).map(x => x.guid)
      from(deviceIds).pipe(
        map(id => {
          return this.devicesService.getPowerState(id).pipe(map(result => {
            return { powerstate: result.powerstate, guid: id }
          }))
        })
      ).subscribe(results => {
        results.subscribe(x => {
          (devices.data.find(y => y.guid === x.guid) as any).powerstate = x.powerstate
        })
      })
      this.isLoading = false
    })
  }

  tagChange (event: MatSelectChange): void {
    this.selectedTags.next(event.value)
  }

  isAllSelected (): boolean {
    const numSelected = this.selection.selected.length
    const numRows = this.devices.data.length
    return numSelected === numRows
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle (): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.devices.data.forEach(row => this.selection.select(row))
  }

  isNoData (): boolean {
    return !this.isLoading && this.devices.data.length === 0
  }

  async navigateTo (path: string): Promise<void> {
    await this.router.navigate([`/devices/${path}`])
  }

  translateConnectionStatus (status?: boolean): string {
    switch (status) {
      case false:
        return 'Disconnected'
      case true:
        return 'Connected'
      default:
        return 'Unknown'
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
      this.devicesService.getPowerState(deviceId).pipe(delay(2000)).subscribe(z => {
        (this.devices.data.find(y => y.guid === deviceId) as any).powerstate = z.powerstate
      })
      console.log(data)
    })
  }

  addDevice (): void {
    this.dialog.open(AddDeviceComponent, {
      height: '400px',
      width: '600px'
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
}
