/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, Input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { Router, ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { MomentModule } from 'ngx-moment'
import { of, Subject } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { DevicesService } from '../devices.service'

import { DeviceDetailComponent } from './device-detail.component'
import { Device } from 'src/models/models'

describe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let sendPowerActionSpy: jasmine.Spy
  let getAuditLogSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let getHardwareInformationSpy: jasmine.Spy
  let getAMTVersionSpy: jasmine.Spy
  let setAMTFeaturesSpy: jasmine.Spy
  let getEventLogSpy: jasmine.Spy
  let addAlarmOccurrenceSpy: jasmine.Spy
  let deleteAlarmOccurrenceSpy: jasmine.Spy
  let getAlarmOccurrencesSpy: jasmine.Spy
  let devicesService: any
  let deviceRecord: Device

  @Component({
    selector: 'app-device-toolbar'
  })
  class TestDeviceToolbarComponent {
    @Input()
    isLoading = false
  }

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj('DevicesService', [
      'getAuditLog',
      'getAMTFeatures',
      'getHardwareInformation',
      'getAMTVersion',
      'sendPowerAction',
      'setAmtFeatures',
      'getEventLog',
      'addAlarmOccurrence',
      'deleteAlarmOccurrence',
      'getAlarmOccurrences'
    ])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    devicesService.device = new Subject<Device>()

    deviceRecord = {
        icon: 0,
        guid: '111',
        tenantId: '',
        connectionStatus: true,
        hostname: 'host01.test.com',
        mpsInstance: '',
        tags: [],
        mpsusername: 'userName01',
        friendlyName: '',
        dnsSuffix: '',
        lastConnected: undefined,
        lastSeen: undefined,
        lastDisconnected: undefined,
        deviceInfo: {
          fwVersion: '16.1',
          fwBuild: '1111',
          fwSku: '16392',
          features: '',
          currentMode: '0',
          ipAddress: '',
          lastUpdated: undefined
        }
    }
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({
      Body: {
        ReturnValueStr: 'NOT_READY'
      }
    }))
    addAlarmOccurrenceSpy = devicesService.addAlarmOccurrence.and.returnValue(of({
      Body: {
        Status: 'SUCCESS'
      }
    }))
    deleteAlarmOccurrenceSpy = devicesService.deleteAlarmOccurrence.and.returnValue(of({
      Body: {
        Status: 'SUCCESS'
      }
    }))
    getAuditLogSpy = devicesService.getAuditLog.and.returnValue(of({ totalCnt: 0, records: [] }))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(of({ }))
    getAMTVersionSpy = devicesService.getAMTVersion.and.returnValue(of({ }))
    getHardwareInformationSpy = devicesService.getHardwareInformation.and.returnValue(of({ }))
    setAMTFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    getEventLogSpy = devicesService.getEventLog.and.returnValue(of([]))
    getAlarmOccurrencesSpy = devicesService.getAlarmOccurrences.and.returnValue(of([]))

    await TestBed.configureTestingModule({
      imports: [
        MomentModule,
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule.withRoutes([])
      ],
      declarations: [DeviceDetailComponent, TestDeviceToolbarComponent],
      providers: [{ provide: DevicesService, useValue: devicesService }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }, {
        provide: Router,
        useValue: {
          url: 'sol'
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

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    devicesService.device.next(deviceRecord)
    expect(component).toBeTruthy()
    expect(getAuditLogSpy.calls.any()).toBe(true, 'getAuditLog called')
    expect(getHardwareInformationSpy.calls.any()).toBe(true, 'getHardwareInformation called')
    expect(getAMTFeaturesSpy.calls.any()).toBe(true, 'getAMTFeatures called')
    expect(getAMTVersionSpy.calls.any()).toBe(true, 'getAMTVersion called')
    expect(getEventLogSpy.calls.any()).toBeTrue()
    expect(getAlarmOccurrencesSpy.calls.any()).toBe(true, 'getAlarmOccurrences called')
    expect(component.deviceState).toEqual(0)
    expect(component.showSol).toBeFalse()
  })

  it('should send power action', () => {
    component.sendPowerAction(4)

    fixture.detectChanges()

    expect(sendPowerActionSpy).toHaveBeenCalledWith('guid', 4, false)
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
  })

  it('should send power action - sol', () => {
    component.sendPowerAction(101)
    fixture.detectChanges()
    expect(sendPowerActionSpy).toHaveBeenCalledWith('guid', 101, true)
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
  })

  it('should parse provisioning mode - ACM', () => {
    const result = component.parseProvisioningMode(1)
    expect(result).toBe('Admin Control Mode (ACM)')
  })
  it('should parse provisioning mode - CCM', () => {
    const result = component.parseProvisioningMode(4)
    expect(result).toBe('Client Control Mode (CCM)')
  })

  it('should trigger the set amt features api when user consent changes', () => {
    component.amtEnabledFeatures.patchValue({
      enableIDER: false,
      enableKVM: false,
      enableSOL: false,
      userConsent: 'none',
      optInState: 0,
      redirection: false
    })

    component.amtEnabledFeatures.get('userConsent')?.setValue('kvm')
    fixture.detectChanges()
    component.setAmtFeatures()
    expect(setAMTFeaturesSpy).toHaveBeenCalled()
  })

  it('should toggle the showSol flag when an action is selected', () => {
    expect(component.showSol).toBeFalse()

    component.onSelectAction()
    expect(component.showSol).toBeTrue()
  })

  it('should update the deviceState variable when device status changes', () => {
    expect(component.deviceState).toEqual(0)

    component.deviceStatus(1)
    expect(component.deviceState).toEqual(1)
  })

  it('should send deleteAlarm', () => {
    spyOn(window, 'confirm').and.returnValue(true)
    spyOn(component, 'reloadAlarms').and.callFake(function () {})
    component.deleteAlarm('Alarm to delete')

    fixture.detectChanges()

    expect(deleteAlarmOccurrenceSpy).toHaveBeenCalledWith('guid', 'Alarm to delete')
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
  })

  it('should send addAlarm', () => {
    spyOn(window, 'confirm').and.returnValue(true)
    spyOn(component, 'reloadAlarms').and.callFake(function () {})
    component.newAlarmForm.patchValue(
      {
        alarmName: 'Test Alarm'
      }
    )
    component.addAlarm()

    fixture.detectChanges()

    expect(addAlarmOccurrenceSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
  })
})
