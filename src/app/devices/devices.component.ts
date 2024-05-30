/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { SelectionModel } from '@angular/cdk/collections'
import { Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatSelectChange } from '@angular/material/select'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { catchError, delay, finalize, map } from 'rxjs/operators'
import { forkJoin, from, Observable, of, throwError } from 'rxjs'
import { Device, PageEventOptions } from 'src/models/models'
import { AddDeviceComponent } from '../shared/add-device/add-device.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DevicesService } from './devices.service'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import { DeviceEditTagsComponent } from './edit-tags/edit-tags.component'
import { caseInsensitiveCompare } from '../../utils'
import { environment } from 'src/environments/environment'
import { AddDeviceEnterpriseComponent } from '../shared/add-device-enterprise/add-device-enterprise.component'

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent implements OnInit {
  public devices: Device[] = []
  public totalCount: number = 0
  public isLoading = true
  public tags: string[] = []
  public filteredTags: string[] = []
  public selectedDevices: SelectionModel<Device>
  public bulkActionResponses: any[] = []
  public isTrue: boolean = false
  public powerStates: any
  public isCloudMode: boolean = true
  displayedColumns: string[] = ['select', 'hostname', 'guid', 'status', 'tags', 'actions', 'notification']

  pageEventOptions: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator

  constructor (public snackBar: MatSnackBar, public dialog: MatDialog, public readonly router: Router, private readonly devicesService: DevicesService) {
    this.selectedDevices = new SelectionModel<Device>(true, [])
    this.powerStates = this.devicesService.PowerStates
    this.isCloudMode = environment.cloud
    if (!this.isCloudMode) {
      this.displayedColumns = ['select', 'hostname', 'status', 'tags', 'actions', 'notification']
    }
  }

  ngOnInit (): void {
    this.getTagsThenDevices()
  }

  // in order to maintain tag filtering when editing tags,
  // the tags need to be retrieved first,
  // then the filter selection (re) established
  // so the device query reflects the tag filter correctly
  getTagsThenDevices (): void {
    this.devicesService.getTags()
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error loading tags`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }), finalize(() => {
          this.getDevices()
        }))
      .subscribe(tags => {
        this.tags = tags
        this.filteredTags = this.filteredTags.filter(t => tags.includes(t))
      })
  }

  getDevices (): void {
    this.isLoading = true
    this.devicesService.getDevices({ ...this.pageEventOptions, tags: this.filteredTags })
      .pipe(
        catchError((err) => {
          this.snackBar.open($localize`Error loading devices`, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          const prevSelected = this.selectedDevices.selected.map(d => d.guid)
          this.selectedDevices.clear()
          const stillSelected = this.devices.filter(d => prevSelected.includes(d.guid))
          this.selectedDevices.select(...stillSelected)
          this.isLoading = false
        }))
      .subscribe(res => {
        this.devices = res.data
        this.totalCount = res.totalCount
        let deviceIds = this.devices.map(x => x.guid)
        if (environment.cloud) {
        deviceIds = this.devices.filter(z => z.connectionStatus).map(x => x.guid)
        }
        from(deviceIds)
          .pipe(
            map(id => {
              return this.devicesService.getPowerState(id).pipe(map(result => {
                return { powerstate: result.powerstate, guid: id }
              }))
            }))
          .subscribe(results => {
            results.subscribe(x => {
              (this.devices.find(y => y.guid === x.guid) as any).powerstate = x.powerstate
            })
          })
      })
  }

  tagFilterChange (event: MatSelectChange): void {
    this.filteredTags = event.value
    this.getDevices()
  }

  bulkEditTags (): void {
    let originalTags: string[] = this.selectedDevices.selected[0].tags.slice()
    this.selectedDevices.selected.forEach(device => {
      originalTags = originalTags.filter(t => device.tags.includes(t))
    })
    const editedTags: string[] = originalTags.slice()
    editedTags.sort(caseInsensitiveCompare)

    const dialogRef = this.dialog.open(DeviceEditTagsComponent, { data: editedTags })
    dialogRef.afterClosed().subscribe(tagsChanged => {
      if (tagsChanged) {
        // figure out which tags were added and/or removed
        const addedTags = editedTags.filter(t => !originalTags.includes(t))
        const removedTags = originalTags.filter(t => !editedTags.includes(t))

        const requests: Array<Observable<any>> = []
        this.isLoading = true
        this.selectedDevices.selected.forEach(device => {
          device.tags = device.tags.filter(t => !removedTags.includes(t))
          device.tags.push(...addedTags.filter(t => !device.tags.includes(t)))
          device.tags.sort(caseInsensitiveCompare)
          const req = this.devicesService
            .updateDevice(device)
            .pipe(
              catchError(err => of({ err }))
            )
          requests.push(req)
        })

        forkJoin(requests).subscribe(result => {
          this.isLoading = false
          result.forEach(res => {
            (this.devices.find(i => i.guid === res.guid) as any).StatusMessage = res.StatusMessage
          })
          this.resetResponse()
          this.getTagsThenDevices()
        })
      }
    })
  }

  editTagsForDevice (deviceId: string): void {
    const device = this.devices.find(d => d.guid === deviceId)
    if (!device) return // device not found
    const editedTags = [...device.tags]
    const dialogRef = this.dialog.open(DeviceEditTagsComponent, { data: editedTags })
    dialogRef.afterClosed().subscribe(tagsChanged => {
      if (tagsChanged) {
        device.tags = editedTags.sort(caseInsensitiveCompare)
        this.devicesService
          .updateDevice(device)
          .subscribe(() => {
            this.getTagsThenDevices()
          })
      }
    })
  }

  areOnlySomeDevicesSelected (): boolean {
    return !this.areAllDevicesSelected() && this.selectedDevices.selected.length > 0
  }

  areAllDevicesSelected (): boolean {
    return this.selectedDevices.selected.length === this.devices.length
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle (): void {
    this.areAllDevicesSelected()
      ? this.selectedDevices.clear()
      : this.devices.forEach(device => this.selectedDevices.select(device))
  }

  isNoData (): boolean {
    return !this.isLoading && this.devices.length === 0
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
    this.isLoading = true
    this.selectedDevices.selected.forEach(z => {
      requests.push(this.devicesService.sendPowerAction(z.guid, action).pipe(
        catchError(err => of({ err })),
        map(i => ({
          StatusMessage: i?.Body?.ReturnValueStr ? i.Body.ReturnValueStr : 'ERROR',
          StatusType: i?.Body && i.Body.ReturnValue !== undefined ? i.Body.ReturnValue : -1,
          guid: z.guid
        }))
      ))
    })

    forkJoin(requests).subscribe(result => {
      this.isLoading = false
      result.forEach(res => {
        (this.devices.find(i => i.guid === res.guid) as any).StatusMessage = res.StatusMessage
      })
      this.resetResponse()
    })
  }

  sendPowerAction (deviceId: string, action: number): void {
    this.isLoading = true
    this.devicesService.sendPowerAction(deviceId, action).pipe(
      catchError((): any => {
        (this.devices.find(x => x.guid === deviceId) as any).StatusMessage = 'ERROR'
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      (this.devices.find(x => x.guid === deviceId) as any).StatusMessage = data.Body.ReturnValueStr
      this.resetResponse()
      this.devicesService.getPowerState(deviceId).pipe(delay(2000)).subscribe(z => {
        (this.devices.find(y => y.guid === deviceId) as any).powerstate = z.powerstate
      })
    }, err => {
      console.error(err)
    })
  }

  sendDeactivate (deviceId: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.isLoading = true
        this.devicesService.sendDeactivate(deviceId).pipe(
          finalize(() => {
            this.isLoading = false
          })
        ).subscribe({
          next: (data) => {
            (this.devices.find(x => x.guid === deviceId) as any).StatusMessage = data?.status ?? ''
            setTimeout(() => {
              this.getTagsThenDevices()
            }, 3000)
          },
          error: (err) => {
            (this.devices.find(x => x.guid === deviceId) as any).StatusMessage = 'ERROR'
            console.error(err)
          }
        })
      }
    })
  }

  bulkDeactivate (): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const requests: Array<Observable<any>> = []
        this.isLoading = true
        this.selectedDevices.selected.forEach(z => {
          requests.push(this.devicesService.sendDeactivate(z.guid).pipe(
            catchError(err => of({ err })),
            map(i => ({
              StatusMessage: i?.status ? i.status : 'ERROR',
              guid: z.guid
            }))
          ))
        })
        forkJoin(requests).subscribe(result => {
          this.isLoading = false
          result.forEach(res => {
            (this.devices.find(i => i.guid === res.guid) as any).StatusMessage = res.StatusMessage
          })
          setTimeout(() => {
            this.getTagsThenDevices()
          }, 3000)
        })
      }
    })
  }

  resetResponse (): void {
    setTimeout(() => {
      const found: any = this.devices.find((item: any) => item.StatusMessage === 'SUCCESS')
      if (found) {
        found.StatusMessage = ''
      }
    }, 5000)
  }

  addDevice (): void {
    if (!environment.cloud) {
      const sub = this.dialog.open(AddDeviceEnterpriseComponent, {
        height: '500px',
        width: '600px'
      })
      sub.afterClosed().subscribe(() => {
        this.getDevices()
      })
    } else {
      this.dialog.open(AddDeviceComponent, {
        height: '500px',
        width: '600px'
      })
    }
  }

  pageChanged (event: PageEvent): void {
    this.pageEventOptions.pageSize = event.pageSize
    this.pageEventOptions.startsFrom = event.pageIndex * event.pageSize
    this.getTagsThenDevices()
  }
}
