/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { MomentModule } from 'ngx-moment'
import { DevicesService } from '../devices.service'

import { EventLogComponent } from './event-log.component'

describe('EventLogComponent', () => {
  let component: EventLogComponent
  let fixture: ComponentFixture<EventLogComponent>
  let eventLogSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getEventLog'])
    eventLogSpy = devicesService.getEventLog.and.returnValue(
      of([
        {
          DeviceAddress: 255,
          EventSensorType: 15,
          EventType: 111,
          EventOffset: 2,
          EventSourceType: 104,
          EventSeverity: 8,
          SensorNumber: 255,
          Entity: 34,
          EntityInstance: 0,
          EventData: [
            64,
            19,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          EntityStr: 'BIOS',
          Desc: 'Starting operating system boot process'
        },
        {
          DeviceAddress: 255,
          EventSensorType: 15,
          EventType: 10,
          EventOffset: 2,
          EventSourceType: 104,
          EventSeverity: 8,
          SensorNumber: 255,
          Entity: 34,
          EntityInstance: 0,
          EventData: [
            64,
            19,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          EntityStr: 'BIOS',
          Desc: 'PCI resource configuration'
        },
        {
          DeviceAddress: 255,
          EventSensorType: 15,
          EventType: 7,
          EventOffset: 2,
          EventSourceType: 104,
          EventSeverity: 8,
          SensorNumber: 255,
          Entity: 34,
          EntityInstance: 0,
          EventData: [
            64,
            19,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          EntityStr: 'BIOS',
          Desc: 'PCI resource configuration'
        },
        {
          DeviceAddress: 255,
          EventSensorType: 15,
          EventType: 1,
          EventOffset: 2,
          EventSourceType: 104,
          EventSeverity: 8,
          SensorNumber: 255,
          Entity: 34,
          EntityInstance: 0,
          EventData: [
            64,
            19,
            0,
            0,
            0,
            0,
            0,
            0
          ],
          EntityStr: 'BIOS',
          Desc: 'PCI resource configuration'
        }
      ])
    )

    await TestBed.configureTestingModule({
      imports: [
        MomentModule,
        BrowserAnimationsModule,
        RouterModule,
        EventLogComponent
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventLogComponent)
    component = fixture.componentInstance
    component.deviceId = 'guid'
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(eventLogSpy).toHaveBeenCalled()
    expect(component.isLoading).toBeFalse()
    expect(component.deviceId).toEqual('guid')
    expect(component.eventLogData.length).toEqual(4)
  })

  it('should return true when isLoading is false and no data', () => {
    component.isLoading = false
    component.eventLogData = []
    expect(component.isNoData()).toBeTrue()
  })
  it('should return true when isLoading is true and no data', () => {
    component.isLoading = true
    component.eventLogData = []
    expect(component.isNoData()).toBeTrue()
  })

  it('should return true when isLoading is true and data exists', () => {
    component.isLoading = true
    expect(component.isNoData()).toBeTrue()
  })

  it('should return false when isLoading is false and data exists', () => {
    component.isLoading = false
    expect(component.isNoData()).toBeFalse()
  })
})
