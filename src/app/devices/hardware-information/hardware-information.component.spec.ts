/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { HardwareInformationComponent } from './hardware-information.component'
import { DevicesService } from '../devices.service'
import { ActivatedRoute } from '@angular/router'
import { EMPTY, of } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'

describe('HardwareInformationComponent', () => {
  let component: HardwareInformationComponent
  let fixture: ComponentFixture<HardwareInformationComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getDevices',
      'updateDevice',
      'getTags',
      'getPowerState',
      'getAMTVersion',
      'getAMTFeatures',
      'getHardwareInformation',
      'getDiskInformation',
      'PowerStates',
      'sendPowerAction',
      'bulkPowerAction',
      'sendDeactivate',
      'sendBulkDeactivate',
      'getWsmanOperations'
    ])
    devicesServiceSpy.getAMTFeatures.and.returnValue(
      of({
        userConsent: 'ALL',
        KVM: true,
        SOL: true,
        IDER: true,
        redirection: true,
        optInState: 1,
        kvmAvailable: true,
        httpsBootSupported: true,
        ocr: true,
        winREBootSupported: true,
        localPBABootSupported: true,
        rpeSupported: true,
        rpeEnabled: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
    )

    devicesServiceSpy.getHardwareInformation.and.returnValue(of({} as any))
    devicesServiceSpy.getDiskInformation.and.returnValue(of({} as any))
    devicesServiceSpy.getAMTVersion.and.returnValue(of(['']))
    devicesServiceSpy.TargetOSMap = { 0: '' } as any
    TestBed.configureTestingModule({
      imports: [HardwareInformationComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ id: 1 }) } },
        { provide: DevicesService, useValue: devicesServiceSpy }
      ]
    })

    fixture = TestBed.createComponent(HardwareInformationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should set isDiskLoading to true then false upon completion', () => {
    component.getDiskInformation()
    expect(component.isDiskLoading()).toBeFalse()
  })

  it('should set isDiskLoading to false when request completes without emitting', () => {
    devicesServiceSpy.getDiskInformation.and.returnValue(EMPTY)
    component.getDiskInformation()
    expect(component.isDiskLoading()).toBeFalse()
  })

  it('should return matching processor for chip tag', () => {
    const mockProc = { DeviceID: 'CPU0', CurrentClockSpeed: 2400, MaxClockSpeed: 3600 } as any
    component.hwInfo = { CIM_Processor: { responses: [mockProc] } } as any
    expect(component.getProcessorForChip('CPU0')).toEqual(mockProc)
  })

  it('should return undefined for non-matching chip tag', () => {
    const mockProc = { DeviceID: 'CPU0' } as any
    component.hwInfo = { CIM_Processor: { responses: [mockProc] } } as any
    expect(component.getProcessorForChip('CPU1')).toBeUndefined()
  })

  it('should return undefined when hwInfo has no processor data', () => {
    component.hwInfo = {} as any
    expect(component.getProcessorForChip('CPU0')).toBeUndefined()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('converts bytes to gigabytes correctly and rounds down', () => {
    expect(component.calculateMediaSize(1000000)).toBe('1 GB')
  })

  it('handles zero bytes', () => {
    expect(component.calculateMediaSize(0)).toBe('0 GB')
  })

  it('rounds correctly for values not exactly multiple of 1 million', () => {
    expect(component.calculateMediaSize(1500000)).toBe('2 GB')
  })

  it('handles large numbers', () => {
    expect(component.calculateMediaSize(1234567890)).toBe('1235 GB')
  })

  it('handles negative numbers', () => {
    expect(component.calculateMediaSize(-1000000)).toBe('-1 GB')
  })
})
