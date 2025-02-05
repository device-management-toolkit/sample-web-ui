/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { EventLogComponent } from './event-log.component'
import { DeviceLogService } from '../device-log.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { environment } from 'src/environments/environment'

describe('EventLogComponent', () => {
  let component: EventLogComponent
  let fixture: ComponentFixture<EventLogComponent>
  let deviceLogServiceSpy: jasmine.SpyObj<DeviceLogService>
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>

  // Sample responses for cloud and non-cloud modes
  // const mockData = {
  //   records: [
  //     {
  //       DeviceAddress: 255,
  //       EventSensorType: 15,
  //       EventType: 1,
  //       EventOffset: 2,
  //       EventSourceType: 104,
  //       EventSeverity: 8,
  //       SensorNumber: 255,
  //       Entity: 34,
  //       EntityInstance: 0,
  //       EventData: [
  //         64,
  //         19,
  //         0,
  //         0,
  //         0,
  //         0,
  //         0,
  //         0
  //       ],
  //       EntityStr: 'BIOS',
  //       Desc: 'Cloud Event'
  //     }
  //   ],
  //   hasMoreRecords: false
  // }

  beforeEach(async () => {
    deviceLogServiceSpy = jasmine.createSpyObj('DeviceLogService', ['getEventLog', 'downloadEventLog'])
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])

    await TestBed.configureTestingModule({
      imports: [EventLogComponent],
      providers: [
        { provide: DeviceLogService, useValue: deviceLogServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents()
  })

  // Create the component instance without immediately triggering change detection.
  beforeEach(() => {
    fixture = TestBed.createComponent(EventLogComponent)
    component = fixture.componentInstance
    component.deviceId = 'test-device'
    // Do not call fixture.detectChanges() here so that we can control when ngAfterViewInit is run.
  })

  afterEach(() => {
    TestBed.resetTestingModule()
    component.isCloudMode = environment.cloud = true
  })

  describe('Utility methods', () => {
    it('should decode event types correctly', () => {
      expect(component.decodeEventType(1)).toBe('Threshold based event')
      expect(component.decodeEventType(7)).toBe('Generic severity event')
      expect(component.decodeEventType(10)).toBe('Linkup Event')
      expect(component.decodeEventType(111)).toBe('Sensor specific event')
    })

    it('should correctly report isNoData', () => {
      // When loading is true, isNoData returns true regardless of data presence.
      component.isLoading.set(true)
      component.dataSource.data = [{}] as any
      expect(component.isNoData()).toBeTrue()

      // When not loading but with no data.
      component.isLoading.set(false)
      component.dataSource.data = []
      expect(component.isNoData()).toBeTrue()

      // When not loading and data exists.
      component.isLoading.set(false)
      component.dataSource.data = [{}] as any
      expect(component.isNoData()).toBeFalse()
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      // Spy on loadEventLogs so we don’t perform actual HTTP calls.
      spyOn(component, 'loadEventLogs')
      component.pageSize = 10
      component.currentPageIndex = 0
    })

    it('should go to next page correctly', () => {
      component.nextPage()
      // nextPage uses pre-increment so currentPageIndex becomes 1 and calls loadEventLogs(1 * pageSize)
      expect(component.currentPageIndex).toBe(1)
      expect(component.loadEventLogs).toHaveBeenCalledWith(10)
    })

    it('should go to last page correctly', () => {
      component.currentPageIndex = 1
      component.lastPage()
      // lastPage decrements currentPageIndex to 0 and calls loadEventLogs(0)
      expect(component.currentPageIndex).toBe(0)
      expect(component.loadEventLogs).toHaveBeenCalledWith(0)
    })
  })

  describe('Download functionality', () => {
    let mockAnchor: any
    let urlCreateObjectURLSpy: jasmine.Spy
    let urlRevokeObjectURLSpy: jasmine.Spy

    beforeEach(() => {
      // Set up a fake anchor element to simulate a download link.
      mockAnchor = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      }
      spyOn(document, 'createElement').and.returnValue(mockAnchor)
      urlCreateObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url')
      urlRevokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL')
    })

    it('should trigger download and create a link with the correct filename', () => {
      // Arrange: simulate a download response (CSV data, for example).
      const mockDownloadData = 'csv,data'
      deviceLogServiceSpy.downloadEventLog.and.returnValue(of(mockDownloadData as any))
      // Act
      component.download()
      // Assert
      expect(deviceLogServiceSpy.downloadEventLog).toHaveBeenCalledWith('test-device')
      expect(urlCreateObjectURLSpy).toHaveBeenCalled()
      expect(mockAnchor.download).toBe(`event_test-device.csv`)
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(urlRevokeObjectURLSpy).toHaveBeenCalledWith('blob:url')
      expect(component.isLoading()).toBeFalse()
    })
  })
})
