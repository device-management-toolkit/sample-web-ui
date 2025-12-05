/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed, tick } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'

import { DevicesComponent } from './devices.component'
import { DevicesService } from './devices.service'
import { Device } from '../../models/models'
import { MatSelectChange } from '@angular/material/select'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('DevicesComponent', () => {
  let device01: Device
  let device02: Device
  let component: DevicesComponent
  let fixture: ComponentFixture<DevicesComponent>
  let getDevicesSpy: jasmine.Spy
  let updateDeviceSpy: jasmine.Spy
  let getTagsSpy: jasmine.Spy
  let sendPowerActionSpy: jasmine.Spy
  let sendDeactivateSpy: jasmine.Spy
  let translate: TranslateService

  beforeEach(async () => {
    device01 = {
      hostname: 'device01',
      friendlyName: '',
      icon: 1,
      connectionStatus: true,
      guid: '12324-4243-ewdsd',
      tags: ['tagA', 'tagCommon01'],
      mpsInstance: '',
      mpsusername: '',
      tenantId: '',
      dnsSuffix: 'mlopshub.com'
    }
    device02 = {
      hostname: 'device02',
      friendlyName: '',
      icon: 1,
      connectionStatus: true,
      guid: '12324-4243-ewdse',
      tags: ['tagB', 'tagCommon01'],
      mpsInstance: '',
      mpsusername: '',
      tenantId: '',
      dnsSuffix: 'mlopshub.com'
    }
    const devicesService = jasmine.createSpyObj('DevicesService', [
      'getDevices',
      'updateDevice',
      'getTags',
      'getPowerState',
      'PowerStates',
      'sendPowerAction',
      'bulkPowerAction',
      'sendDeactivate',
      'sendBulkDeactivate'
    ])
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
    getDevicesSpy = devicesService.getDevices.and.returnValue(of({ data: [device01, device02], totalCount: 1 }))
    updateDeviceSpy = devicesService.updateDevice.and.callFake((device: any) => {
      return of(device)
    })
    getTagsSpy = devicesService.getTags.and.returnValue(of([]))
    devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({ Body: { ReturnValueStr: 'SUCCESS' } }))
    sendDeactivateSpy = devicesService.sendDeactivate.and.returnValue(of({ status: 'SUCCESS' }))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([{ path: 'devices', component: DevicesComponent }]),
        DevicesComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DevicesComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    component.ngOnInit()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    component.isCloudMode = true
    expect(component).toBeTruthy()
    expect(getDevicesSpy.calls.any()).toBe(true, 'getDevices called')
    expect(getTagsSpy.calls.any()).toBe(true, 'getTags called')
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
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
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
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.addDevice()
    expect(dialogSpy).toHaveBeenCalled()
  })
  xit('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDevicesSpy.calls.any()).toBe(true, 'getDevices called')
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })
  xit('should reset response', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    ;(component.devices.data[0] as any).StatusMessage = 'SUCCESS'
    component.resetResponse()
    tick(5001)
    expect((component.devices.data[0] as any).StatusMessage).toEqual('')
  })
  it('should fire bulk power action', () => {
    const resetResponseSpy = spyOn(component, 'resetResponse')
    component.selectedDevices.select(component.devices.data[0])
    component.resetResponse()
    fixture.detectChanges()
    component.bulkPowerAction(8)
    expect(resetResponseSpy).toHaveBeenCalled()
  })
  it('should fire send power action', () => {
    const resetSpy = spyOn(component, 'resetResponse')
    component.sendPowerAction(device01.guid, 2)
    expect(sendPowerActionSpy).toHaveBeenCalled()
    expect(resetSpy).toHaveBeenCalled()
  })

  it('should select all rows on change the master toggle', () => {
    component.masterToggle()
    expect(component.selectedDevices.selected).toEqual(component.devices.data)
  })

  it('should clear the selection when unselect the master toggle', () => {
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
    component.masterToggle()
    expect(component.selectedDevices.selected).toEqual([])
  })

  it('should fire deactivate action', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.sendDeactivate(device01.guid)
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalled()
  })
  it('should fire bulk deactivate action', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.selectedDevices.select(component.devices.data[0])
    component.bulkDeactivate()
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalledTimes(1)
  })
  it('should fire bulk edit tags', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
    component.bulkEditTags()
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(updateDeviceSpy).toHaveBeenCalledTimes(2)
  })
  it('should fire device edit tags', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
    component.editTagsForDevice(device01.guid)
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(updateDeviceSpy).toHaveBeenCalledTimes(1)
  })
  it('should call tagFilterChange', () => {
    const mockMatSelect = jasmine.createSpyObj('MatSelect', ['value'])
    const mockValue = 'mockTag'
    const matSelectChange: MatSelectChange = {
      source: mockMatSelect,
      value: mockValue
    }

    component.tagFilterChange(matSelectChange)
    expect(component.filteredTags()).toBe(mockValue)
  })
})
