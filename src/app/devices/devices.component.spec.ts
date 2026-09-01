/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj } from '../../test-helpers'
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
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('DevicesComponent', () => {
  let device01: Device
  let device02: Device
  let component: DevicesComponent
  let fixture: ComponentFixture<DevicesComponent>
  let getDevicesSpy: MockInstance
  let updateDeviceSpy: MockInstance
  let getTagsSpy: MockInstance
  let sendPowerActionSpy: MockInstance
  let sendDeactivateSpy: MockInstance
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
      dnsSuffix: 'vprodemo.com'
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
      dnsSuffix: 'vprodemo.com'
    }
    const devicesService = createSpyObj('DevicesService', [
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
    devicesService.PowerStates.mockReturnValue({
      2: 'On',
      3: 'Sleep',
      4: 'Sleep',
      6: 'Off',
      7: 'Hibernate',
      8: 'Off',
      9: 'Power Cycle',
      13: 'Off'
    })
    getDevicesSpy = devicesService.getDevices.mockReturnValue(of({ data: [device01, device02], totalCount: 1 }))
    updateDeviceSpy = devicesService.updateDevice.mockImplementation((device: any) => {
      return of(device)
    })
    getTagsSpy = devicesService.getTags.mockReturnValue(of([]))
    devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.mockReturnValue(of({ Body: { ReturnValueStr: 'SUCCESS' } }))
    sendDeactivateSpy = devicesService.sendDeactivate.mockReturnValue(of({ status: 'SUCCESS' }))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([{ path: 'devices', component: DevicesComponent }]),
        DevicesComponent
      ],
      providers: [
        provideTranslateService(),
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
    expect(getDevicesSpy.mock.calls.length > 0, 'getDevices called').toBe(true)
    expect(getTagsSpy.mock.calls.length > 0, 'getTags called').toBe(true)
  })

  it('should determine if all selected (false)', () => {
    const result = component.isAllSelected()
    expect(result).toBe(false)
  })
  it('should determine if all selected (true)', () => {
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
    const result = component.isAllSelected()
    expect(result).toBe(true)
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
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo('guid')
    expect(routerSpy).toHaveBeenCalledWith(['/devices/guid'])
  })
  it('should open the add device dialog', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.addDevice()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it.skip('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDevicesSpy.mock.calls.length > 0, 'getDevices called').toBe(true)
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })
  it.skip('should reset response', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    ;(component.devices.data[0] as any).StatusMessage = 'SUCCESS'
    component.resetResponse()
    tick(5001)
    expect((component.devices.data[0] as any).StatusMessage).toEqual('')
  })
  it('should fire bulk power action', () => {
    const resetResponseSpy = vi.spyOn(component, 'resetResponse').mockImplementation(() => undefined)
    component.selectedDevices.select(component.devices.data[0])
    component.resetResponse()
    fixture.detectChanges()
    component.bulkPowerAction(8)
    expect(resetResponseSpy).toHaveBeenCalled()
  })
  it('should fire send power action', () => {
    const resetSpy = vi.spyOn(component, 'resetResponse').mockImplementation(() => undefined)
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
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.sendDeactivate(device01.guid)
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalled()
  })
  it('should fire bulk deactivate action', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.selectedDevices.select(component.devices.data[0])
    component.bulkDeactivate()
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalledTimes(1)
  })
  it('should fire bulk edit tags', () => {
    expect(component.devices.data.length).toBeGreaterThan(0)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
    component.bulkEditTags()
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(updateDeviceSpy).toHaveBeenCalledTimes(2)
  })
  it('should fire device edit tags', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.devices.data.forEach((d) => component.selectedDevices.select(d))
    component.editTagsForDevice(device01.guid)
    fixture.detectChanges()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(updateDeviceSpy).toHaveBeenCalledTimes(1)
  })
  it('should call tagFilterChange', () => {
    const mockMatSelect = createSpyObj('MatSelect', ['value'])
    const mockValue = 'mockTag'
    const matSelectChange: MatSelectChange = {
      source: mockMatSelect,
      value: mockValue
    }

    component.tagFilterChange(matSelectChange)
    expect(component.filteredTags()).toBe(mockValue)
  })
})
