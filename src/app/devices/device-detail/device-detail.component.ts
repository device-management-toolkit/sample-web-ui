/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatList, MatListItem, MatListItemTitle, MatListItemLine, MatListModule } from '@angular/material/list'
import { provideNativeDateAdapter } from '@angular/material/core'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router'
import { ExplorerComponent } from '../explorer/explorer.component'
import { AlarmsComponent } from '../alarms/alarms.component'
import { CertificatesComponent } from '../certificates/certificates.component'
import { EventLogComponent } from '../event-log/event-log.component'
import { AuditLogComponent } from '../audit-log/audit-log.component'
import { HardwareInformationComponent } from '../hardware-information/hardware-information.component'
import { SolComponent } from '../sol/sol.component'
import { KvmComponent } from '../kvm/kvm.component'
import { GeneralComponent } from '../general/general.component'
import { NetworkSettingsComponent } from '../network-settings/network-settings.component'
import { environment } from 'src/environments/environment'
import { TLSComponent } from '../tls/tls.component'
import { TranslateModule } from '@ngx-translate/core'

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
    TranslateModule
  ]
})
export class DeviceDetailComponent implements OnInit {
  // Dependency Injection
  private readonly activatedRoute = inject(ActivatedRoute)
  public deviceId = ''
  public readonly isCloudMode: boolean = environment.cloud

  categories = [
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
    }
  ]

  constructor() {
    if (!this.isCloudMode) {
      this.categories.push(
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
  }

  public currentView = 'general'
  public isLoading = signal(false)
  isCollapsed = false

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.isLoading.set(true)
      this.deviceId = params.id
      this.currentView = params.component || 'general'
    })
  }

  toggleSidenav(): void {
    this.isCollapsed = !this.isCollapsed
  }

  setCurrentView(category: any): void {
    this.currentView = category.component
  }
}
