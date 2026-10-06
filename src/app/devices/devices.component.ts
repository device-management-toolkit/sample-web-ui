/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { SelectionModel } from '@angular/cdk/collections'
import { Overlay, OverlayRef } from '@angular/cdk/overlay'
import { TemplatePortal } from '@angular/cdk/portal'
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  signal
} from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatSelectChange, MatSelect } from '@angular/material/select'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router, RouterModule } from '@angular/router'
import { catchError, concatMap, delay, finalize, map, switchMap } from 'rxjs/operators'
import { forkJoin, from, Observable, of, throwError } from 'rxjs'
import { Device, DeviceFilterStatus, PageEventOptions, PowerState } from '../../models/models'
import { AddDeviceComponent } from '../shared/add-device/add-device.component'
import SnackbarDefaults from '../shared/config/snackBarDefault'
import { DevicesService } from './devices.service'
import { AreYouSureDialogComponent } from '../shared/are-you-sure/are-you-sure.component'
import { DeviceEditTagsComponent } from './edit-tags/edit-tags.component'
import { caseInsensitiveCompare } from '../../utils'
import { environment } from '../../environments/environment'
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
import { MatFormField, MatHint, MatLabel, MatPrefix } from '@angular/material/form-field'
import { MatCard, MatCardContent } from '@angular/material/card'
import { MatProgressBar } from '@angular/material/progress-bar'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIcon } from '@angular/material/icon'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatToolbar } from '@angular/material/toolbar'
import { MatSort } from '@angular/material/sort'
import { MatInput } from '@angular/material/input'
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs'
import { MatDivider } from '@angular/material/divider'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { DiscoveredDevicePaneComponent } from './discovered-device-pane/discovered-device-pane.component'

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  imports: [
    MatInput,
    MatToolbar,
    MatButton,
    MatPrefix,
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
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatDivider,
    TranslatePipe,
    DiscoveredDevicePaneComponent
  ]
})
export class DevicesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly snackBar = inject(MatSnackBar)
  private readonly dialog = inject(MatDialog)
  private readonly devicesService = inject(DevicesService)
  public readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  private readonly overlay = inject(Overlay)
  private readonly viewContainerRef = inject(ViewContainerRef)
  private readonly elementRef = inject(ElementRef<HTMLElement>)

  public devices: MatTableDataSource<Device> = new MatTableDataSource<Device>()

  public totalCount = signal(0)
  public isLoading = signal(true)
  public tags = signal<string[]>([])
  public filteredTags = signal<string[]>([])
  // Per-device state that changes after the list has loaded, keyed by guid.
  public readonly powerStateByGuid = signal<Record<string, number>>({})
  public readonly statusMessageByGuid = signal<Record<string, string>>({})
  public readonly tagsByGuid = signal<Record<string, string[]>>({})
  public selectedDevices: SelectionModel<Device>
  public bulkActionResponses: any[] = []
  public isTrue = false
  public powerStates: any
  public isCloudMode: boolean = environment.cloud

  // Discovered/Managed tabs are a console-only concept. Managed is tab 0 (shown
  // first) since Discovered requires rpc-go v3, which isn't released yet.
  public activeTab = signal(0)
  private readonly serverTotalCount = signal(0)
  private readonly serverActivatedCount = signal(0)
  private readonly serverDiscoveredCount = signal(0)

  // Discovered device shown in the side pane, and the row that opened it so focus can return there.
  public readonly paneDevice = signal<Device | null>(null)
  private paneTrigger: HTMLElement | null = null
  private paneOverlay?: OverlayRef
  @ViewChild('paneTemplate') paneTemplate!: TemplateRef<unknown>

  get allCount(): number {
    return this.serverTotalCount()
  }

  // Count for the currently selected tab, used to drive the paginator length.
  get currentTabCount(): number {
    if (this.isCloudMode) {
      return this.serverTotalCount()
    }
    return this.activeTab() === 0 ? this.serverActivatedCount() : this.serverDiscoveredCount()
  }

  get discoveredTabLabel(): string {
    return `${this.translate.instant('devices.tabs.discovered.value')} (${this.discoveredCount})`
  }

  get managedTabLabel(): string {
    return `${this.translate.instant('devices.tabs.managed.value')} (${this.activatedCount})`
  }

  get activatedCount(): number {
    return this.serverActivatedCount()
  }

  get discoveredCount(): number {
    return this.serverDiscoveredCount()
  }

  // Power actions don't apply to devices that haven't been activated yet.
  get isDiscoveredTab(): boolean {
    return !this.isCloudMode && this.activeTab() === 1
  }

  onTabChange(index: number): void {
    this.activeTab.set(index)
    this.paneDevice.set(null)
    // Different tabs return different result sets, so reset paging to the first page.
    this.pageEvent.startsFrom = 0
    if (this.paginator) {
      this.paginator.pageIndex = 0
    }
    this.getDevices()
  }

  private currentTabStatus(): DeviceFilterStatus | undefined {
    if (this.isCloudMode) {
      return undefined
    }
    return this.activeTab() === 0 ? 'activated' : 'discovered'
  }

  private loadStats(): void {
    this.devicesService.getStats().subscribe({
      next: (stats) => {
        this.serverTotalCount.set(stats.totalCount)
        this.serverActivatedCount.set(stats.activatedCount)
        this.serverDiscoveredCount.set(stats.discoveredCount)
        this.totalCount.set(this.currentTabCount)
      },
      error: (err) => {
        console.error('Error loading device stats:', err)
      }
    })
  }

  get deleteDeviceLabel(): string {
    return this.isCloudMode
      ? this.translate.instant('devices.actions.deactivateCloud.value')
      : this.translate.instant('devices.actions.remove.value')
  }

  // controlMode is only meaningful for activated devices, so it's hidden on the Discovered tab.
  get displayedColumns(): string[] {
    const columns = this.isCloudMode ? [
          'select',
          'hostname',
          'guid',
          'status',
          'productType'
        ] : [
          'select',
          'hostname',
          'productType'
        ]
    if (!this.isCloudMode && !this.isDiscoveredTab) {
      columns.push('controlMode')
    }
    columns.push('tags', 'actions', 'notification')
    return columns
  }

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
  }

  ngOnInit(): void {
    this.getTagsThenDevices()
  }

  ngAfterViewInit(): void {
    this.devices.paginator = this.paginator
    this.devices.sort = this.sort
    // The overlay stays attached; the template's @if decides whether the pane is showing,
    // which lets its leave animation run before it is removed.
    this.paneOverlay = this.overlay.create({ positionStrategy: this.overlay.position().global() })
    this.paneOverlay.attach(new TemplatePortal(this.paneTemplate, this.viewContainerRef))
  }

  ngOnDestroy(): void {
    this.paneOverlay?.dispose()
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.devices.filter = filterValue.trim().toLowerCase()
  }
  editDevice(device: Device): void {
    if (!environment.cloud) {
      const sub = this.dialog.open(AddDeviceEnterpriseComponent, {
        height: '650px',
        width: '700px',
        data: device
      })
      sub.afterClosed().subscribe((result) => {
        if (result?.submitted) {
          window.location.reload()
          this.snackBar.open('Device updated successfully', undefined, SnackbarDefaults.defaultSuccess)
        }
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
    let responseTotalCount: number | undefined

    if (!this.isCloudMode) {
      // Console exposes server-side counts for the discovered/managed tabs.
      this.loadStats()
    }

    // Store previous selection before making the request
    const prevSelected = this.selectedDevices.selected.map((d) => d.guid)

    this.devicesService
      .getDevices({ ...this.pageEvent, tags: this.filteredTags(), status: this.currentTabStatus() })
      .pipe(
        switchMap((res) => {
          responseTotalCount = res.totalCount
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
          const msg: string = this.translate.instant('devices.errorLoadDevices.value')
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
        this.powerStateByGuid.set(
          Object.fromEntries(devices.map((d) => [d.guid, (d as Device & PowerState).powerstate]))
        )
        this.statusMessageByGuid.set({})
        this.tagsByGuid.set(Object.fromEntries(devices.map((d) => [d.guid, d.tags])))
        // Keep the pane on the refreshed copy of its device, or close it if the device left this page.
        const openGuid = this.paneDevice()?.guid
        if (openGuid) {
          this.paneDevice.set(devices.find((d) => d.guid === openGuid) ?? null)
        }
        if (this.isCloudMode) {
          // Cloud has no discovered/managed split, so the paginated response's
          // totalCount is authoritative for the paginator length.
          this.serverTotalCount.set(responseTotalCount ?? devices.length)
          this.totalCount.set(this.serverTotalCount())
        }

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
          const tags = device.tags.filter((t) => !removedTags.includes(t))
          tags.push(...addedTags.filter((t) => !tags.includes(t)))
          this.setTags(device, tags.sort(caseInsensitiveCompare))
          const req = this.devicesService.updateDevice(device).pipe(catchError((err) => of({ err })))
          requests.push(req)
        })

        forkJoin(requests).subscribe((result) => {
          this.isLoading.set(false)
          result.forEach((res) => {
            this.setStatusMessage(res.guid, res.StatusMessage)
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
        this.setTags(device, editedTags.sort(caseInsensitiveCompare))
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
    return !this.isLoading() && this.devices.data.length === 0
  }

  async navigateTo(path: string): Promise<void> {
    await this.router.navigate([`/devices/${path}`])
  }

  // A discovered device has no credentials in console, so the device page can't connect to it.
  // Show what it reported during discovery instead.
  async openDevice(device: Device, event?: Event): Promise<void> {
    // Enter pressed on a button inside the row belongs to that button, not the row.
    if (event instanceof KeyboardEvent && event.target !== event.currentTarget) return
    if (this.isDiscoveredTab) {
      this.paneTrigger = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null
      // The overlay lives outside the app's [dir] element, so pass the page direction through for RTL.
      const dir = this.elementRef.nativeElement.closest('[dir]')?.getAttribute('dir')
      this.paneOverlay?.setDirection(dir === 'rtl' ? 'rtl' : 'ltr')
      this.paneDevice.set(device)
      return
    }
    await this.navigateTo(device.guid)
  }

  closePane(): void {
    this.paneDevice.set(null)
    this.paneTrigger?.focus()
    this.paneTrigger = null
  }

  getProductType(device: Device): string {
    const skuNum = parseInt(device.deviceInfo?.fwSku ?? '', 10)
    if (isNaN(skuNum)) return ''
    const isISM = (skuNum & 0x10) > 0
    const isVPro = (skuNum & 0x08) > 0
    if (isISM) return 'ISM'
    if (isVPro) return 'vPro'
    return 'non-vPro'
  }

  getControlMode(device: Device): string {
    const currentMode = device.deviceInfo?.currentMode
    if (currentMode === undefined) return 'unknown'
    const normalized = currentMode.trim().toLowerCase()
    if (!normalized || normalized === 'not activated' || normalized === 'pre-provisioning state') return 'notActivated'
    if (normalized.includes('admin')) return 'acm'
    if (normalized.includes('client')) return 'ccm'
    return 'unknown'
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
        this.setStatusMessage(res.guid, res.StatusMessage)
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
          this.setStatusMessage(deviceId, 'ERROR')
        }),
        finalize(() => {
          this.isLoading.set(false)
        })
      )
      .subscribe({
        next: (data) => {
          this.setStatusMessage(deviceId, data.Body.ReturnValueStr)
          this.resetResponse()
          this.devicesService
            .getPowerState(deviceId)
            .pipe(delay(2000))
            .subscribe((z) => {
              this.powerStateByGuid.update((states) => ({ ...states, [deviceId]: z.powerstate }))
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
              this.setStatusMessage(deviceId, data?.status ?? '')
              if (environment.cloud) {
                setTimeout(() => {
                  this.getTagsThenDevices()
                }, 3000)
              } else {
                this.getDevices()
              }
            },
            error: (err) => {
              this.setStatusMessage(deviceId, 'ERROR')
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
                this.setStatusMessage(res.guid, res.StatusMessage)
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

  private setStatusMessage(guid: string, message: string): void {
    this.statusMessageByGuid.update((messages) => ({ ...messages, [guid]: message }))
  }

  // The row object is what gets saved; the signal is what the tags cell renders.
  private setTags(device: Device, tags: string[]): void {
    device.tags = tags
    this.tagsByGuid.update((all) => ({ ...all, [device.guid]: tags }))
  }

  resetResponse(): void {
    setTimeout(() => {
      this.statusMessageByGuid.update((messages) =>
        Object.fromEntries(
          Object.entries(messages).map(([guid, message]) => [guid, message === 'SUCCESS' ? '' : message])
        )
      )
    }, 5000)
  }

  addDevice(): void {
    if (!environment.cloud) {
      const sub = this.dialog.open(AddDeviceEnterpriseComponent, {
        height: '650px',
        width: '700px'
      })
      sub.afterClosed().subscribe((result) => {
        if (result?.submitted) {
          this.getDevices()
        }
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
