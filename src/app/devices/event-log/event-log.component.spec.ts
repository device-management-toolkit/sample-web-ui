/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { EventLogComponent } from './event-log.component'
import { DeviceLogService } from '../device-log.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { environment } from '../../../environments/environment'
import { provideTranslateService } from '@ngx-translate/core'

describe('EventLogComponent', () => {
  let component: EventLogComponent
  let fixture: ComponentFixture<EventLogComponent>
  let deviceLogServiceSpy: SpyObj<DeviceLogService>
  let snackBarSpy: SpyObj<MatSnackBar>

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

  beforeEach(() => {
    deviceLogServiceSpy = createSpyObj('DeviceLogService', ['getEventLog', 'downloadEventLog'])
    snackBarSpy = createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      imports: [EventLogComponent],
      providers: [
        provideTranslateService(),
        { provide: DeviceLogService, useValue: deviceLogServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
  })

  // Create the component instance without immediately triggering change detection.
  beforeEach(() => {
    fixture = TestBed.createComponent(EventLogComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('deviceId', 'test-device')
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
      expect(component.isNoData()).toBe(true)

      // When not loading but with no data.
      component.isLoading.set(false)
      component.dataSource.data = []
      expect(component.isNoData()).toBe(true)

      // When not loading and data exists.
      component.isLoading.set(false)
      component.dataSource.data = [{}] as any
      expect(component.isNoData()).toBe(false)
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      // Spy on loadEventLogs so we don’t perform actual HTTP calls.
      vi.spyOn(component, 'loadEventLogs').mockImplementation(() => undefined)
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
    let createElementSpy: MockInstance
    let urlCreateObjectURLSpy: MockInstance
    let urlRevokeObjectURLSpy: MockInstance

    beforeEach(() => {
      // Set up a fake anchor element to simulate a download link.
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }
      const createElement = document.createElement.bind(document)
      // Only intercept the download anchor: every spec file shares this document, and
      // TestBed needs the real createElement to mount component fixtures.
      createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation(((tagName: string, options?: ElementCreationOptions) =>
          tagName === 'a' ? mockAnchor : createElement(tagName, options)) as any)
      urlCreateObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url')
      urlRevokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined)
    })

    afterEach(() => {
      createElementSpy.mockRestore()
      urlCreateObjectURLSpy.mockRestore()
      urlRevokeObjectURLSpy.mockRestore()
    })

    it('should trigger download and create a link with the correct filename', () => {
      // Arrange: simulate a download response (CSV data, for example).
      const mockDownloadData = 'csv,data'
      deviceLogServiceSpy.downloadEventLog.mockReturnValue(of(mockDownloadData as any))
      // Act
      component.download()
      // Assert
      expect(deviceLogServiceSpy.downloadEventLog).toHaveBeenCalledWith('test-device')
      expect(urlCreateObjectURLSpy).toHaveBeenCalled()
      expect(mockAnchor.download).toBe(`event_test-device.csv`)
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(urlRevokeObjectURLSpy).toHaveBeenCalledWith('blob:url')
      expect(component.isLoading()).toBe(false)
    })
  })
})
