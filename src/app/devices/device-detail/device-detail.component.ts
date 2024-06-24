/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, OnInit } from '@angular/core'
import { FormBuilder } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DevicesService } from '../devices.service'
import { ActivatedRoute, Router } from '@angular/router'

@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.component.html',
  styleUrl: './device-detail.component.scss'
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
