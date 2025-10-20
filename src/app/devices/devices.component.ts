/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { SelectionModel } from '@angular/cdk/collections'
import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatSelectChange, MatSelect } from '@angular/material/select'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router, RouterModule } from '@angular/router'
import { catchError, concatMap, delay, finalize, map, switchMap } from 'rxjs/operators'
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
import { MatChipSet, MatChip } from '@angular/material/chips'
import { MatCheckbox } from '@angular/material/checkbox'
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
import { MatOption } from '@angular/material/core'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field'
import { MatCard, MatCardContent } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIcon } from '@angular/material/icon'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatToolbar } from '@angular/material/toolbar'
import { MatSort } from '@angular/material/sort'
import { MatInput } from '@angular/material/input'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  imports: [
    MatInput,
    MatToolbar,
    MatButton,
    MatIcon,
    MatSort,
    MatIconButton,
    MatTooltip,
    MatProgressBar,
    MatCard,
    MatFormField,
    MatLabel,
    MatSelect,
    ReactiveFormsModule,
    FormsModule,
    MatOption,
    MatCardContent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCheckbox,
    MatCellDef,
    MatCell,
    MatChipSet,
    MatChip,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    MatHint,
    RouterModule,
    TranslateModule
  ]
})
export class DevicesComponent implements OnInit, AfterViewInit {
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)
  private readonly devicesService = inject(DevicesService)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)

  public devices: MatTableDataSource<Device> = new MatTableDataSource<Device>()

  public totalCount = signal(0)
  public isLoading = signal(true)
  public tags = signal<string[]>([])
  public filteredTags = signal<string[]>([])
  public selectedDevices: SelectionModel<Device>
  public bulkActionResponses: any[] = []
  public isTrue = false
  public powerStates: any
  public isCloudMode: boolean = environment.cloud

  get deleteDeviceLabel(): string {
    return this.isCloudMode
      ? this.translate.instant('devices.actions.deactivateCloud.value')
      : this.translate.instant('devices.actions.remove.value')
  }

  public displayedColumns: string[] = [
    'select',
    'hostname',
    'guid',
    'status',
    'tags',
    'actions',
    'notification'
  ]

  public pageEvent: PageEventOptions = {
    pageSize: 25,
    startsFrom: 0,
    count: 'true'
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor() {
    this.selectedDevices = new SelectionModel<Device>(true, [])
    this.powerStates = this.devicesService.PowerStates
    if (!this.isCloudMode) {
      this.displayedColumns = [
        'select',
        'hostname',
        'tags',
        'actions',
        'notification'
      ]
    }
  }

  ngOnInit(): void {
    this.getTagsThenDevices()
  }

  ngAfterViewInit(): void {
    this.devices.paginator = this.paginator
    this.devices.sort = this.sort
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.devices.filter = filterValue.trim().toLowerCase()
  }
  editDevice(device: Device): void {
    if (!environment.cloud) {
      const sub = this.dialog.open(AddDeviceEnterpriseComponent, {
        height: '500px',
        width: '600px',
        data: device
      })
      sub.afterClosed().subscribe(() => {
        window.location.reload()
        this.snackBar.open('Device updated successfully', undefined, SnackbarDefaults.defaultSuccess)
      })
    }
  }

  // in order to maintain tag filtering when editing tags,
  // the tags need to be retrieved first,
  // then the filter selection (re) established
  // so the device query reflects the tag filter correctly
  getTagsThenDevices(): void {
    this.devicesService
      .getTags()
      .pipe(
        catchError((err) => {
          const msg: string = this.translate.instant('devices.errorLoadTags.value')

          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          return throwError(err)
        }),
        finalize(() => {
          this.getDevices()
        })
      )
      .subscribe((tags) => {
        this.tags.set(tags)
        this.filteredTags.set(this.filteredTags().filter((t) => tags.includes(t)))
      })
  }

  getDevices(): void {
    this.isLoading.set(true)

    // Store previous selection before making the request
    const prevSelected = this.selectedDevices.selected.map((d) => d.guid)

    this.devicesService
      .getDevices({ ...this.pageEvent, tags: this.filteredTags() })
      .pipe(
        switchMap((res) => {
          this.totalCount.set(res.totalCount)

          if (!environment.cloud) {
            return of(res.data) // Return as-is for non-cloud
          }

          const connectedDevices = res.data.filter((d) => d.connectionStatus)
          if (connectedDevices.length === 0) {
            return of(res.data)
          }

          // Get all power states in parallel
          const powerStateRequests = connectedDevices.map((device) =>
            this.devicesService.getPowerState(device.guid).pipe(
              map((powerResult) => ({ ...device, powerstate: powerResult.powerstate })),
              catchError((error) => {
                console.error(`Failed to get power state for device ${device.guid}:`, error)
                return of(device) // Return device as-is if error occurs
              })
            )
          )

          return forkJoin(powerStateRequests).pipe(
            map((updatedDevices) => {
              const deviceMap = new Map(updatedDevices.map((d) => [d.guid, d]))
              return res.data.map((device) => deviceMap.get(device.guid) || device)
            })
          )
        }),
        catchError((err) => {
          console.error('Error in getDevices:', err)
          const msg: string = this.translate.instant('configs.failDeleteConfigs.value')
          this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
          // Return an empty array on error
          return of([])
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe((devices) => {
        this.devices.data = devices

        // Restore selection state on data retrieval
        this.selectedDevices.clear()
        const stillSelected = devices.filter((d) => prevSelected.includes(d.guid))
        this.selectedDevices.select(...stillSelected)
      })
  }

  tagFilterChange(event: MatSelectChange): void {
    this.filteredTags.set(event.value)
    this.getDevices()
  }

  bulkEditTags(): void {
    let originalTags: string[] = this.selectedDevices.selected[0].tags.slice()
    this.selectedDevices.selected.forEach((device) => {
      originalTags = originalTags.filter((t) => device.tags.includes(t))
    })
    const editedTags: string[] = originalTags.slice()
    editedTags.sort(caseInsensitiveCompare)

    const dialogRef = this.dialog.open(DeviceEditTagsComponent, { data: editedTags })
    dialogRef.afterClosed().subscribe((tagsChanged) => {
      if (tagsChanged) {
        // figure out which tags were added and/or removed
        const addedTags = editedTags.filter((t) => !originalTags.includes(t))
        const removedTags = originalTags.filter((t) => !editedTags.includes(t))

        const requests: Observable<any>[] = []
        this.isLoading.set(true)
        this.selectedDevices.selected.forEach((device) => {
          device.tags = device.tags.filter((t) => !removedTags.includes(t))
          device.tags.push(...addedTags.filter((t) => !device.tags.includes(t)))
          device.tags.sort(caseInsensitiveCompare)
          const req = this.devicesService.updateDevice(device).pipe(catchError((err) => of({ err })))
          requests.push(req)
        })

        forkJoin(requests).subscribe((result) => {
          this.isLoading.set(false)
          result.forEach((res) => {
            ;(this.devices.data.find((i) => i.guid === res.guid) as any).StatusMessage = res.StatusMessage
          })
          this.resetResponse()
          this.getTagsThenDevices()
        })
      }
    })
  }

  editTagsForDevice(deviceId: string): void {
    const device = this.devices.data.find((d) => d.guid === deviceId)
    if (!device) return // device not found
    const editedTags = device.tags == null ? [] : [...device.tags]
    const dialogRef = this.dialog.open(DeviceEditTagsComponent, { data: editedTags })
    dialogRef.afterClosed().subscribe((tagsChanged) => {
      if (tagsChanged) {
        device.tags = editedTags.sort(caseInsensitiveCompare)
        this.devicesService.updateDevice(device).subscribe(() => {
          this.getTagsThenDevices()
        })
      }
    })
  }

  areOnlySomeDevicesSelected(): boolean {
    return !this.isAllSelected() && this.selectedDevices.selected.length > 0
  }

  isAllSelected(): boolean {
    return this.selectedDevices.selected.length === this.devices.data.length
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedDevices.clear()
    } else {
      this.devices.data.forEach((device) => this.selectedDevices.select(device))
    }
  }

  isNoData(): boolean {
    return !this.isLoading() && this.totalCount() === 0
  }

  async navigateTo(path: string): Promise<void> {
    await this.router.navigate([`/devices/${path}`])
  }

  translateConnectionStatus(status?: boolean): string {
    switch (status) {
      case false:
        return 'Disconnected'
      case true:
        return 'Connected'
      default:
        return 'Unknown'
    }
  }

  bulkPowerAction(action: number): void {
    const requests: Observable<any>[] = []
    this.isLoading.set(true)
    this.selectedDevices.selected.forEach((z) => {
      requests.push(
        this.devicesService.sendPowerAction(z.guid, action).pipe(
          catchError((err) => of({ err })),
          map((i) => ({
            StatusMessage: i?.Body?.ReturnValueStr ? i.Body.ReturnValueStr : 'ERROR',
            StatusType: i?.Body && i.Body.ReturnValue !== undefined ? i.Body.ReturnValue : -1,
            guid: z.guid
          }))
        )
      )
    })

    forkJoin(requests).subscribe((result) => {
      this.isLoading.set(false)
      result.forEach((res) => {
        ;(this.devices.data.find((i) => i.guid === res.guid) as any).StatusMessage = res.StatusMessage
      })
      this.resetResponse()
    })
  }

  sendPowerAction(deviceId: string, action: number): void {
    this.isLoading.set(true)
    this.devicesService
      .sendPowerAction(deviceId, action)
      .pipe(
        catchError((): any => {
          ;(this.devices.data.find((x) => x.guid === deviceId) as any).StatusMessage = 'ERROR'
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (data) => {
          ;(this.devices.data.find((x) => x.guid === deviceId) as any).StatusMessage = data.Body.ReturnValueStr
          this.resetResponse()
          this.devicesService
            .getPowerState(deviceId)
            .pipe(delay(2000))
            .subscribe((z) => {
              ;(this.devices.data.find((y) => y.guid === deviceId) as any).powerstate = z.powerstate
            })
        },
        error: (err) => {
          console.error(err)
        }
      })
  }

  sendDeactivate(deviceId: string): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading.set(true)
        this.devicesService
          .sendDeactivate(deviceId)
          .pipe(
            finalize(() => {
              this.isLoading.set(false)
            })
          )
          .subscribe({
            next: (data) => {
              ;(this.devices.data.find((x) => x.guid === deviceId) as any).StatusMessage = data?.status ?? ''
              if (environment.cloud) {
                setTimeout(() => {
                  this.getTagsThenDevices()
                }, 3000)
              } else {
                this.getDevices()
              }
            },
            error: (err) => {
              ;(this.devices.data.find((x) => x.guid === deviceId) as any).StatusMessage = 'ERROR'
              console.error(err)
            }
          })
      }
    })
  }

  bulkDeactivate(): void {
    const dialogRef = this.dialog.open(AreYouSureDialogComponent)
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading.set(true)
        from(this.selectedDevices.selected)
          .pipe(
            concatMap((device) =>
              this.devicesService.sendDeactivate(device.guid).pipe(
                catchError((err) => of({ err })),
                this.isCloudMode
                  ? map((i) => ({
                      StatusMessage: i?.status ? i.status : 'ERROR',
                      guid: device.guid
                    }))
                  : map((res) => res),
                this.isCloudMode ? map((res) => res) : delay(500) // Delay after each request if not in cloud mode
              )
            )
          )
          .subscribe({
            next: (res) => {
              if (this.isCloudMode) {
                ;(this.devices.data.find((i) => i.guid === res.guid) as any).StatusMessage = res.StatusMessage
              }
            },
            error: () => {
              const msg: string = this.translate.instant('devices.errorDeactivateDevice.value')

              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
            },
            complete: () => {
              this.isLoading.set(false)
              setTimeout(() => {
                this.getTagsThenDevices()
              }, 1500)
            }
          })
      }
    })
  }

  resetResponse(): void {
    setTimeout(() => {
      const found: any = this.devices.data.find((item: any) => item.StatusMessage === 'SUCCESS')
      if (found) {
        found.StatusMessage = ''
      }
    }, 5000)
  }

  addDevice(): void {
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

  pageChanged(event: PageEvent): void {
    this.pageEvent.pageSize = event.pageSize
    this.pageEvent.startsFrom = event.pageIndex * event.pageSize
    this.getTagsThenDevices()
  }
}
