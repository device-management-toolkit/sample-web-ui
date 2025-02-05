/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { Device } from 'src/models/models'
import { EventEmitter } from '@angular/core'

describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let sendPowerActionSpy: jasmine.Spy
  let getDeviceSpy: jasmine.Spy
  let sendDeactivateSpy: jasmine.Spy
  let sendDeactivateErrorSpy: jasmine.Spy
  let devicesService: jasmine.SpyObj<DevicesService>

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj('DevicesService', [
      'sendPowerAction',
      'getDevice',
      'sendDeactivate'
    ])
    devicesService.deviceState = new EventEmitter<number>()

    devicesService.TargetOSMap = { 0: 'Unknown' } as any
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(
      of({
        Body: {
          ReturnValueStr: 'NOT_READY'
        }
      })
    )

    getDeviceSpy = devicesService.getDevice.and.returnValue(of({ guid: 'guid' } as any))
    sendDeactivateSpy = devicesService.sendDeactivate.and.returnValue(of({ status: 'SUCCESS' }))
    sendDeactivateErrorSpy = devicesService.sendDeactivate.and.returnValue(throwError({ error: 'Error' }))
    devicesService.device = new Subject<Device>()

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceToolbarComponent
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(DeviceToolbarComponent)
    component = fixture.componentInstance
    component.deviceId = 'guid'

    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDeviceSpy).toHaveBeenCalledWith('guid')
  })
  it('should send power action', () => {
    component.deviceId = 'guid'
    component.sendPowerAction(4)

    fixture.detectChanges()

    expect(sendPowerActionSpy).toHaveBeenCalledWith('guid', 4, false)
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
  })
  it('should navigate to device', async () => {
    component.deviceId = '12345-pokli-456772'
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('guid')
    expect(routerSpy).toHaveBeenCalledWith([`/devices/${component.deviceId}/guid`])
  })
  it('should navigate to devices', async () => {
    component.deviceId = '12345-pokli-456772'
    const routerSpy = spyOn(component.router, 'navigate')
    spyOnProperty(component.router, 'url', 'get').and.returnValue(`/devices/${component.deviceId}`)
    await component.navigateTo('devices')
    expect(routerSpy).toHaveBeenCalledWith(['/devices'])
  })
  it('should send deactivate action', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.sendDeactivate()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalled()
    expect(sendDeactivateErrorSpy).toHaveBeenCalled()
  })
})
