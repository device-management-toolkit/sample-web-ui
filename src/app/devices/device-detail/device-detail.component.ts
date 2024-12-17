/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, OnInit, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DevicesService } from '../devices.service'
import { DatePipe } from '@angular/common'
import { MomentModule } from 'ngx-moment'
import { MatSlideToggle } from '@angular/material/slide-toggle'
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker'
import { MatInput } from '@angular/material/input'
import { MatFormField, MatError, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field'
import { MatList, MatListItem, MatListItemTitle, MatListItemLine, MatListModule } from '@angular/material/list'
import { MatOption, provideNativeDateAdapter } from '@angular/material/core'
import { MatSelect } from '@angular/material/select'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatDivider } from '@angular/material/divider'
import { MatIcon } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card'
import { MatButton, MatIconButton } from '@angular/material/button'
import { MatStepper, MatStep, MatStepLabel } from '@angular/material/stepper'
import { MatTabGroup, MatTab } from '@angular/material/tabs'
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router'
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
    MomentModule,
    RouterLink,
    RouterLinkActive,
    NetworkSettingsComponent,
    TLSComponent
  ]
})
export class DeviceDetailComponent implements OnInit {
  snackBar = inject(MatSnackBar)
  readonly activatedRoute = inject(ActivatedRoute)
  readonly router = inject(Router)
  private readonly devicesService = inject(DevicesService)
  fb = inject(FormBuilder)

  public deviceId = ''
  public isCloudMode: boolean = environment.cloud

  categories = [
    {
      name: 'General AMT Info',
      description: 'AMT Version and Features',
      description2: '',
      component: 'general',
      icon: 'info'
    },
    {
      name: 'KVM',
      description: 'Remotely control device',
      component: 'kvm',
      icon: 'tv'
    },
    {
      name: 'SOL',
      description: 'Serial Over LAN',
      component: 'sol',
      icon: 'keyboard'
    },
    {
      name: 'Hardware Information',
      description: 'Memory, CPU, etc...',
      component: 'hardware-info',
      icon: 'memory'
    },
    {
      name: 'Audit Log',
      description: 'View device audit log',
      component: 'audit-log',
      icon: 'history'
    },
    {
      name: 'Event Log',
      description: 'View device events',
      component: 'event-log',
      icon: 'event_list'
    },
    {
      name: 'Alarms',
      description: 'Manage device alarms',
      component: 'alarms',
      icon: 'alarm'
    }
  ]

  constructor() {
    if (!this.isCloudMode) {
      this.categories.push({
        name: 'Certificates',
        description: 'Manage certificates',
        component: 'certificates',
        icon: 'verified'
      })
      this.categories.push({
        name: 'Explorer',
        description: 'Send WSMAN commands',
        component: 'explorer',
        icon: 'search'
      })
      this.categories.push({
        name: 'Network Settings',
        description: 'View network settings',
        component: 'network-settings',
        icon: 'lan'
      })
      this.categories.push({
        name: 'TLS Settings',
        description: 'View TLS configuration',
        component: 'tls',
        icon: 'license'
      })
    }
  }

  public currentView = 'general'
  public isLoading = false
  isCollapsed = false

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.isLoading = true

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
