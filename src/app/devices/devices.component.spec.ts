/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from '../shared/shared.module'

import { DevicesComponent } from './devices.component'
import { DevicesService } from './devices.service'
import { Device } from '../../models/models'

describe('DevicesComponent', () => {
  let device: Device
  let component: DevicesComponent
  let fixture: ComponentFixture<DevicesComponent>
  let getDevicesSpy: jasmine.Spy
  let getTagsSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let sendPowerActionSpy: jasmine.Spy
  let sendDeactivateSpy: jasmine.Spy

  beforeEach(async () => {
    device = {
      hostname: 'device01',
      friendlyName: '',
      icon: 1,
      connectionStatus: true,
      guid: '12324-4243-ewdsd',
      tags: ['']
    }
    const devicesService = jasmine.createSpyObj('DevicesService', ['getDevices', 'getTags', 'getPowerState', 'PowerStates', 'sendPowerAction', 'bulkPowerAction', 'sendDeactivate', 'sendBulkDeactivate'])
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
    getDevicesSpy = devicesService.getDevices.and.returnValue(of({ data: [device], totalCount: 1 }))
    getTagsSpy = devicesService.getTags.and.returnValue(of([]))
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({ Body: { ReturnValueStr: 'SUCCESS' } }))
    sendDeactivateSpy = devicesService.sendDeactivate.and.returnValue(of({ status: 'SUCCESS' }))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([{ path: 'devices', component: DevicesComponent }])],
      declarations: [DevicesComponent],
      providers: [
        { provide: DevicesService, useValue: devicesService }]

    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DevicesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
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
  it('should translate connection status - true', () => {
    const result = component.translateConnectionStatus(true)
    expect(result).toBe('Connected')
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
  it('should reset response', fakeAsync(() => {
    expect(component.devices.data.length).toBeGreaterThan(0);
    (component.devices.data[0] as any).StatusMessage = 'SUCCESS'
    component.resetResponse()
    tick(5001)
    const result = component.devices.data.every((val: any) =>
      val.StatusMessage === ''
    )
    expect(result).toBeTrue()
  }))
  it('should fire bulk power action', () => {
    const resetResponseSpy = spyOn(component, 'resetResponse')
    component.selection.select(component.devices.data[0])
    component.resetResponse()
    fixture.detectChanges()
    component.bulkPowerAction(8)
    expect(resetResponseSpy).toHaveBeenCalled()
  })
  it('should fire send power action', () => {
    const resetSpy = spyOn(component, 'resetResponse')
    component.sendPowerAction(device.guid, 2)
    expect(sendPowerActionSpy).toHaveBeenCalled()
    expect(resetSpy).toHaveBeenCalled()
  })

  it('should select all rows on change the master toggle', () => {
    component.masterToggle()
    expect(component.selection.selected).toEqual(component.devices.data)
  })

  it('should clear the selection when unselect the master toggle', () => {
    component.selection.select(component.devices.data[0])
    component.masterToggle()
    expect(component.selection.selected).toEqual([])
  })

  it('should fire deactivate action', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.sendDeactivate(device.guid)
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalled()
  })
  it('should fire bulk deactivate action', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.selection.select(component.devices.data[0])
    component.bulkDeactivate()
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalledTimes(1)
  })
})
