/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { GeneralComponent } from './general.component'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'

describe('GeneralComponent', () => {
  let component: GeneralComponent
  let fixture: ComponentFixture<GeneralComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(() => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getDevices',
      'updateDevice',
      'getTags',
      'getPowerState',
      'getAMTVersion',
      'getAMTFeatures',
      'getGeneralSettings',
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
        remoteErase: true
      })
    )
    devicesServiceSpy.getGeneralSettings.and.returnValue(of({}))
    devicesServiceSpy.getAMTVersion.and.returnValue(of(['']))
    TestBed.configureTestingModule({
      imports: [GeneralComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ id: 1 }) } },
        { provide: DevicesService, useValue: devicesServiceSpy }
      ]
    })

    fixture = TestBed.createComponent(GeneralComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
