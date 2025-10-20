/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule, provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceDetailComponent } from './device-detail.component'
import { provideNativeDateAdapter } from '@angular/material/core'
import { Component, signal, input } from '@angular/core'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { GeneralComponent } from '../general/general.component'
import { TranslateModule } from '@ngx-translate/core'

describe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let devicesService: any
  @Component({
    selector: 'app-device-toolbar',
    imports: []
  })
  class TestDeviceToolbarComponent {
    readonly isLoading = input(signal(false))

    public readonly deviceId = input('')
  }
  @Component({
    selector: 'app-general',
    imports: []
  })
  class TestGeneralComponent {
    readonly isLoading = input(signal(false))

    public readonly deviceId = input('')
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterModule,
        DeviceDetailComponent,
        TestDeviceToolbarComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]), // Provide an empty router configuration
        provideNativeDateAdapter(),
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        }
      ]
    }).overrideComponent(DeviceDetailComponent, {
      remove: { imports: [DeviceToolbarComponent, GeneralComponent] },
      add: { imports: [TestDeviceToolbarComponent, TestGeneralComponent] }
    })

    fixture = TestBed.createComponent(DeviceDetailComponent)
    component = fixture.componentInstance
    component.ngOnInit()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
