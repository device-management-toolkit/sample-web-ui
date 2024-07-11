/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { HardwareInformationComponent } from './hardware-information.component'
import { DevicesService } from '../devices.service'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

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
      'PowerStates',
      'sendPowerAction',
      'bulkPowerAction',
      'sendDeactivate',
      'sendBulkDeactivate',
      'getWsmanOperations'
    ])
    devicesServiceSpy.getAMTFeatures.and.returnValue(
      of({ userConsent: 'ALL', KVM: true, SOL: true, IDER: true, redirection: true, optInState: 1 })
    )

    devicesServiceSpy.getHardwareInformation.and.returnValue(of({} as any))
    devicesServiceSpy.getAMTVersion.and.returnValue(of(['']))
    devicesServiceSpy.TargetOSMap = { 0: '' } as any
    await TestBed.configureTestingModule({
      imports: [HardwareInformationComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ id: 1 }) } },
        { provide: DevicesService, useValue: devicesServiceSpy }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(HardwareInformationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
