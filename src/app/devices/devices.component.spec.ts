/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from '../shared/shared.module'

import { DevicesComponent } from './devices.component'
import { DevicesService } from './devices.service'

describe('DevicesComponent', () => {
  let component: DevicesComponent
  let fixture: ComponentFixture<DevicesComponent>
  let getDevicesSpy: jasmine.Spy
  let getTagsSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getDevices', 'getTags', 'getPowerState', 'PowerStates'])
    devicesService.PowerStates.and.returnValue({
      2: 'On',
      3: 'Sleep',
      4: 'Sleep',
      6: 'Off',
      7: 'Hibernate',
      8: 'Off',
      9: 'Power Cycle',
      13: 'Off'
    })
    getDevicesSpy = devicesService.getDevices.and.returnValue(of({ data: [{ hostname: '', guid: '', connectionStatus: true, tags: [], icon: 1 }], totalCount: 1 }))
    getTagsSpy = devicesService.getTags.and.returnValue(of([]))
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DevicesComponent],
      providers: [{ provide: DevicesService, useValue: devicesService }]

    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DevicesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDevicesSpy.calls.any()).toBe(true, 'getDevices called')
    expect(getTagsSpy.calls.any()).toBe(true, 'getTags called')
    expect(getPowerStateSpy.calls.any()).toBe(true, 'getPowerState called')
  })

  it('should translate connection status - true', () => {
    const result = component.translateConnectionStatus(true)
    expect(result).toBe('Connected')
  })
  it('should determine if all selected (false)', () => {
    const result = component.isAllSelected()
    expect(result).toBeFalse()
  })
  it('should determine if all selected (true)', () => {
    component.selection.select(component.devices.data[0])
    const result = component.isAllSelected()
    expect(result).toBeTrue()
  })
  it('should translate connection status - false', () => {
    const result = component.translateConnectionStatus(false)
    expect(result).toBe('Disconnected')
  })
  it('should translate connection status - null', () => {
    const result = component.translateConnectionStatus()
    expect(result).toBe('Unknown')
  })
  it('should navigate to', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('guid')
    expect(routerSpy).toHaveBeenCalledWith(['/devices/guid'])
  })
  it('should open the add device dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.addDevice()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDevicesSpy.calls.any()).toBe(true, 'getDevices called')
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })
})
