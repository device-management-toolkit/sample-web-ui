/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let sendPowerActionSpy: jasmine.Spy
  let getDeviceSpy: jasmine.Spy
  let sendDeactivateSpy: jasmine.Spy
  let sendDeactivateErrorSpy: jasmine.Spy
  let deviceServiceStub: { stopwebSocket: { next: any }, startwebSocket: { next: any }, connectKVMSocket: { next: any } }
  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['sendPowerAction', 'getDevice', 'sendDeactivate'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({
      Body: {
        ReturnValueStr: 'NOT_READY'
      }
    }))
    getDeviceSpy = devicesService.getDevice.and.returnValue(of({}))
    sendDeactivateSpy = devicesService.sendDeactivate.and.returnValue(of({ status: 'SUCCESS' }))
    sendDeactivateErrorSpy = devicesService.sendDeactivate.and.returnValue(throwError({ error: 'Error' }))
    deviceServiceStub = {
      stopwebSocket: { next: jasmine.createSpy('stopwebSocket next') },
      startwebSocket: { next: jasmine.createSpy('startwebSocket next') },
      connectKVMSocket: { next: jasmine.createSpy('connectKVMSocket next') }
    }

    await TestBed.configureTestingModule({
      declarations: [DeviceToolbarComponent],
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      providers: [{ provide: DevicesService, useValue: { ...deviceServiceStub, ...devicesService } }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceToolbarComponent)
    component = fixture.componentInstance
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
  it('should navigate to kvm', async () => {
    component.deviceId = '12345-pokli-456772'
    spyOnProperty(component.router, 'url', 'get').and.returnValue(`/devices/${component.deviceId}/kvm`)
    await component.navigateTo('kvm')
    expect(deviceServiceStub.connectKVMSocket.next).toHaveBeenCalled()
  })
  it('should navigate to sol', async () => {
    component.deviceId = '12345-pokli-456772'
    spyOnProperty(component.router, 'url', 'get').and.returnValue(`/devices/${component.deviceId}/sol`)
    await component.navigateTo('sol')
    expect(deviceServiceStub.startwebSocket.next).toHaveBeenCalled()
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
  it('should stop sol ', () => {
    component.stopSol()
    fixture.detectChanges()
    expect(deviceServiceStub.stopwebSocket.next).toHaveBeenCalled()
  })
  it('should stop kvm', () => {
    component.stopKvm()
    fixture.detectChanges()
    expect(deviceServiceStub.stopwebSocket.next).toHaveBeenCalled()
  })
})
