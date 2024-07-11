/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { AlarmsComponent } from './alarms.component'
import { DevicesService } from '../devices.service'
import { provideNativeDateAdapter } from '@angular/material/core'
import { of } from 'rxjs'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'

describe('AlarmsComponent', () => {
  let component: AlarmsComponent
  let fixture: ComponentFixture<AlarmsComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getDevices',
      'updateDevice',
      'getAlarmOccurrences',
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

    devicesServiceSpy.getAlarmOccurrences.and.returnValue(of([{ StartTime: {} } as any]))
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AlarmsComponent],
      providers: [provideNativeDateAdapter(), { provide: DevicesService, useValue: devicesServiceSpy }]
    }).compileComponents()

    fixture = TestBed.createComponent(AlarmsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
