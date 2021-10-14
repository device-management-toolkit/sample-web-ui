/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { Component, Input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { MomentModule } from 'ngx-moment'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'

import { DeviceDetailComponent } from './device-detail.component'

describe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let getAuditLogSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let getHardwareInformationSpy: jasmine.Spy
  let getAMTVersionSpy: jasmine.Spy

  @Component({
    selector: 'app-device-toolbar'
  })
  class TestDeviceToolbarComponent {
    @Input()
    isLoading = false
  }

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getAuditLog', 'getAMTFeatures', 'getHardwareInformation', 'getAMTVersion', 'sendPowerAction'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    getAuditLogSpy = devicesService.getAuditLog.and.returnValue(of({ totalCnt: 0, records: [] }))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(of({ }))
    getAMTVersionSpy = devicesService.getAMTVersion.and.returnValue(of({ }))
    getHardwareInformationSpy = devicesService.getHardwareInformation.and.returnValue(of({ }))

    await TestBed.configureTestingModule({
      imports: [MomentModule, BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DeviceDetailComponent, TestDeviceToolbarComponent],
      providers: [{ provide: DevicesService, useValue: devicesService }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getAuditLogSpy.calls.any()).toBe(true, 'getAuditLog called')
    expect(getHardwareInformationSpy.calls.any()).toBe(true, 'getHardwareInformation called')
    expect(getAMTFeaturesSpy.calls.any()).toBe(true, 'getAMTFeatures called')
    expect(getAMTVersionSpy.calls.any()).toBe(true, 'getAMTVersion called')
  })

  it('should navigate to', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/devices/guid/path'])
  })

  it('should parse provisioning mode - ACM', async () => {
    const result = component.parseProvisioningMode(1)
    expect(result).toBe('Admin Control Mode (ACM)')
  })
  it('should parse provisioning mode - CCM', async () => {
    const result = component.parseProvisioningMode(4)
    expect(result).toBe('Client Control Mode (CCM)')
  })
})
