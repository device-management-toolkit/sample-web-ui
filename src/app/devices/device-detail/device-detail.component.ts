/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatList, MatListItem, MatListItemTitle, MatListItemLine, MatListModule } from '@angular/material/list'
import { provideNativeDateAdapter } from '@angular/material/core'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router'
import { catchError, of, Subject, switchMap, takeUntil } from 'rxjs'
import { ExplorerComponent } from '../explorer/explorer.component'
import { AlarmsComponent } from '../alarms/alarms.component'
import { CertificatesComponent } from '../certificates/certificates.component'
import { EventLogComponent } from '../event-log/event-log.component'
import { AuditLogComponent } from '../audit-log/audit-log.component'
import { HardwareInformationComponent } from '../hardware-information/hardware-information.component'
import { SolComponent } from '../sol/sol.component'
import { KvmComponent } from '../kvm/kvm.component'
import { IderComponent } from '../ider/ider.component'
import { GeneralComponent } from '../general/general.component'
import { NetworkSettingsComponent } from '../network-settings/network-settings.component'
import { environment } from '../../../environments/environment'
import { TLSComponent } from '../tls/tls.component'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatSnackBar } from '@angular/material/snack-bar'

interface DeviceDetailCategory {
  name: string
  description: string
  description2?: string
  component: string
  icon: string
}

@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.component.html',
  styleUrls: ['./device-detail.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    AlarmsComponent,
    CertificatesComponent,
    EventLogComponent,
    AuditLogComponent,
    HardwareInformationComponent,
    SolComponent,
    KvmComponent,
    IderComponent,
    GeneralComponent,
    ExplorerComponent,
    DeviceToolbarComponent,
    MatSidenavContainer,
    MatListModule,
    MatSidenav,
    MatSidenavContent,
    MatTooltip,
    MatIcon,
    ReactiveFormsModule,
    MatList,
    MatListItem,
    MatListItemTitle,
    MatListItemLine,
    RouterLink,
    RouterLinkActive,
    NetworkSettingsComponent,
    TLSComponent,
    TranslatePipe
  ]
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  private readonly activatedRoute = inject(ActivatedRoute)
  private readonly devicesService = inject(DevicesService)
  private readonly translate = inject(TranslateService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly destroy$ = new Subject<void>()
  private readonly ismSku = '16400'
  public deviceId = ''
  public readonly isCloudMode: boolean = environment.cloud
  public isISMSystem = signal(false)
  public categories = computed(() => {
    const base: DeviceDetailCategory[] = [
      {
        name: 'deviceDetail.general.value',
        description: 'deviceDetail.generalDescription.value',
        description2: '',
        component: 'general',
        icon: 'info'
      },
      {
        name: 'deviceDetail.kvm.value',
        description: 'deviceDetail.kvmDescription.value',
        component: 'kvm',
        icon: 'tv'
      },
      {
        name: 'deviceDetail.sol.value',
        description: 'deviceDetail.solDescription.value',
        component: 'sol',
        icon: 'keyboard'
      },
      {
        name: 'deviceDetail.hardwareInfo.value',
        description: 'deviceDetail.hardwareInfoDescription.value',
        component: 'hardware-info',
        icon: 'memory'
      },
      {
        name: 'deviceDetail.auditLog.value',
        description: 'deviceDetail.auditLogDescription.value',
        component: 'audit-log',
        icon: 'history'
      },
      {
        name: 'deviceDetail.eventLog.value',
        description: 'deviceDetail.eventLogDescription.value',
        component: 'event-log',
        icon: 'event_list'
      },
      {
        name: 'deviceDetail.alarms.value',
        description: 'deviceDetail.alarmsDescription.value',
        component: 'alarms',
        icon: 'alarm'
      },
      {
        name: 'deviceDetail.certificates.value',
        description: 'deviceDetail.certificatesDescription.value',
        component: 'certificates',
        icon: 'verified'
      },
      {
        name: 'deviceDetail.ider.value',
        description: 'deviceDetail.iderDescription.value',
        component: 'ider',
        icon: 'storage'
      }
    ]
    const filtered = base
      .filter((c) => !(this.isISMSystem() && c.component === 'kvm'))
      .filter((c) => !(!this.isISMSystem() && c.component === 'ider'))
    if (!this.isCloudMode) {
      filtered.push(
        {
          name: 'deviceDetail.explorer.value',
          description: 'deviceDetail.explorerDescription.value',
          component: 'explorer',
          icon: 'search'
        },
        {
          name: 'deviceDetail.networkSettings.value',
          description: 'deviceDetail.networkSettingsDescription.value',
          component: 'network-settings',
          icon: 'lan'
        },
        {
          name: 'deviceDetail.tlsSettings.value',
          description: 'deviceDetail.tlsSettingsDescription.value',
          component: 'tls',
          icon: 'license'
        }
      )
    }
    return filtered
  })

  public currentView = 'general'
  public isLoading = signal(false)
  isCollapsed = false

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const deviceChanged = params.id !== this.deviceId
          this.deviceId = params.id
          this.currentView = params.component || 'general'

          if (!deviceChanged) {
            const isIsm = this.isISMSystem()
            if (isIsm && this.currentView === 'kvm') this.currentView = 'ider'
            if (!isIsm && this.currentView === 'ider') this.currentView = 'kvm'
            return of(null)
          }
          this.isLoading.set(true)

          return this.devicesService.getAMTVersion(this.deviceId).pipe(
            catchError(() => {
              const msg: string = this.translate.instant('general.errorAMTVersion.value')
              this.snackBar.open(msg, undefined, SnackbarDefaults.defaultError)
              return of(undefined)
            })
          )
        })
      )
      .subscribe({
        next: (amtVersion) => {
          if (amtVersion == null) {
            this.isLoading.set(false)
            return
          }
          const sku: string = amtVersion?.CIM_SoftwareIdentity?.responses?.[4]?.VersionString ?? ''
          this.isISMSystem.set(sku === this.ismSku)
          const isIsm = this.isISMSystem()
          if (isIsm && this.currentView === 'kvm') this.currentView = 'ider'
          if (!isIsm && this.currentView === 'ider') this.currentView = 'kvm'
          this.isLoading.set(false)
        },
        error: () => {
          this.isLoading.set(false)
        }
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  toggleSidenav(): void {
    this.isCollapsed = !this.isCollapsed
  }

  setCurrentView(category: any): void {
    this.currentView = category.component
  }
}
