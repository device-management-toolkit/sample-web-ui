/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
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
import { ActivatedRoute, Router } from '@angular/router'
import { ExplorerComponent } from 'src/app/explorer/explorer.component'
import { AlarmsComponent } from '../alarms/alarms.component'
import { EventLogComponent } from '../event-log/event-log.component'
import { AuditLogComponent } from '../audit-log/audit-log.component'
import { HardwareInformationComponent } from '../hardware-information/hardware-information.component'
import { SolComponent } from '../sol/sol.component'
import { KvmComponent } from '../kvm/kvm.component'
import { GeneralComponent } from '../general/general.component'

@Component({
    selector: 'app-device-detail',
    templateUrl: './device-detail.component.html',
    styleUrls: ['./device-detail.component.scss'],
    standalone: true,
    providers: [provideNativeDateAdapter()],
    imports: [AlarmsComponent, EventLogComponent, AuditLogComponent, HardwareInformationComponent, SolComponent, KvmComponent, GeneralComponent, ExplorerComponent, DeviceToolbarComponent, MatSidenavContainer, MatListModule, MatSidenav, MatTabGroup, MatTab, MatStepper, MatStep, MatStepLabel, MatButton, MatSidenavContent, MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatTooltip, MatIcon, MatDivider, ReactiveFormsModule, MatCheckbox, MatSelect, MatOption, MatList, MatListItem, MatListItemTitle, MatListItemLine, MatIconButton, MatFormField, MatInput, MatError, MatHint, MatLabel, MatDatepickerInput, MatDatepickerToggle, MatSuffix, MatDatepicker, MatSlideToggle, MomentModule, DatePipe]
})
export class DeviceDetailComponent implements OnInit {
  public deviceId: string = ''

  categories = [
    {
      name: 'General AMT Information',
      description: 'AMT Version and Features',
      component: 'general',
      icon: 'info'
    },
    {
      name: 'KVM',
      description: 'Remotely view/control the device',
      component: 'kvm',
      icon: 'tv'

      },
      {
      name: 'SOL',
      description: 'Remotely manage the device with Serial Over LAN',
      component: 'sol',
      icon: 'keyboard'
      },
    {
      name: 'Hardware Information',
      description: 'Memory, CPU, and other hardware information about the device',
      component: 'hardware-info',
      icon: 'memory'
      },
    {
    name: 'Audit Log',
    description: 'View the audit log of the device',
    component: 'audit-log',
    icon: 'history'
  },
  {
  name: 'Event Log',
  description: 'View events that have occurred on the device',
  component: 'event-log',
  icon: 'event_list'
  },
  {
    name: 'Alarms',
    description: 'Manage alarms for the device',
    component: 'alarms',
    icon: 'alarm'
    }
]

constructor (public snackBar: MatSnackBar, public readonly activatedRoute: ActivatedRoute, public readonly router: Router, private readonly devicesService: DevicesService, public fb: FormBuilder) {

}

public currentView = 'general'
public isLoading = false
ngOnInit (): void {
  this.activatedRoute.params.subscribe(params => {
    this.isLoading = true
    this.deviceId = params.id
    this.currentView = params.component || 'general'
  })
}

setCurrentView (category: any): void {
  this.currentView = category.component
  // update current URL
  void this.router.navigate([`/devices/${this.deviceId}/${category.component}`])
}
}
