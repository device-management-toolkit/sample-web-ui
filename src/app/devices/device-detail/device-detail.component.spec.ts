/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { Router, ActivatedRoute, RouterModule } from '@angular/router'
import { MomentModule } from 'ngx-moment'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceDetailComponent } from './device-detail.component'
import { provideNativeDateAdapter } from '@angular/material/core'
import { Component, Input } from '@angular/core'

xdescribe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let devicesService: any
  @Component({
    selector: 'app-device-toolbar',
    imports: [MomentModule]
  })
  class TestDeviceToolbarComponent {
    @Input()
    isLoading = false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MomentModule,
        NoopAnimationsModule,
        RouterModule,
        DeviceDetailComponent,
        TestDeviceToolbarComponent
      ],
      providers: [
        provideNativeDateAdapter(),
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        },
        {
          provide: Router,
          useValue: {
            url: 'sol'
          }
        }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(DeviceDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
