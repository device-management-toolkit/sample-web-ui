/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { DeviceLogService } from './device-log.service'
import { environment } from '../../environments/environment'
import { AuditLogResponse, EventLogResponse } from '../../models/models'

describe('DeviceLogService', () => {
  let service: DeviceLogService
  let httpMock: HttpTestingController

  const originalMpsServer = environment.mpsServer
  const mpsServer = 'https://test-server'
  const deviceId = 'device-1'
  const baseUrl = `${mpsServer}/api/v1/amt/log`

  beforeEach(() => {
    environment.mpsServer = mpsServer
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    service = TestBed.inject(DeviceLogService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    environment.mpsServer = originalMpsServer
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('downloadAuditLog should request the audit log download as a blob', () => {
    const blob = new Blob(['audit'])
    let result: Blob | undefined

    service.downloadAuditLog(deviceId).subscribe((data) => (result = data))

    const req = httpMock.expectOne(`${baseUrl}/audit/${deviceId}/download`)
    expect(req.request.method).toBe('GET')
    expect(req.request.responseType).toBe('blob')
    req.flush(blob)
    expect(result).toBe(blob)
  })

  it('getAuditLog should request the audit log from the given start index', () => {
    const mockResponse: AuditLogResponse = { totalCnt: 0, records: [] }
    let result: AuditLogResponse | undefined

    service.getAuditLog(deviceId, 20).subscribe((data) => (result = data))

    const req = httpMock.expectOne(`${baseUrl}/audit/${deviceId}?startIndex=20`)
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
    expect(result).toEqual(mockResponse)
  })

  it('getAuditLog should default the start index to 0', () => {
    service.getAuditLog(deviceId).subscribe()

    httpMock.expectOne(`${baseUrl}/audit/${deviceId}?startIndex=0`).flush({ totalCnt: 0, records: [] })
  })

  it('getAuditLog should propagate http errors', () => {
    let error: any

    service.getAuditLog(deviceId).subscribe({ error: (err) => (error = err) })

    httpMock
      .expectOne(`${baseUrl}/audit/${deviceId}?startIndex=0`)
      .flush('failed', { status: 500, statusText: 'Server Error' })
    expect(error.status).toBe(500)
  })

  it('downloadEventLog should request the event log download as a blob', () => {
    const blob = new Blob(['events'])
    let result: Blob | undefined

    service.downloadEventLog(deviceId).subscribe((data) => (result = data))

    const req = httpMock.expectOne(`${baseUrl}/event/${deviceId}/download`)
    expect(req.request.method).toBe('GET')
    expect(req.request.responseType).toBe('blob')
    req.flush(blob)
    expect(result).toBe(blob)
  })

  it('getEventLog should request the event log with the default paging', () => {
    const mockResponse: EventLogResponse = { hasMoreRecords: false, records: [] }
    let result: EventLogResponse | undefined

    service.getEventLog(deviceId).subscribe((data) => (result = data))

    const req = httpMock.expectOne(`${baseUrl}/event/${deviceId}?$skip=0&$top=120`)
    expect(req.request.method).toBe('GET')
    req.flush(mockResponse)
    expect(result).toEqual(mockResponse)
  })

  it('getEventLog should pass the given start index and max records', () => {
    service.getEventLog(deviceId, 120, 50).subscribe()

    httpMock.expectOne(`${baseUrl}/event/${deviceId}?$skip=120&$top=50`).flush({ hasMoreRecords: false, records: [] })
  })

  it('getEventLog should propagate http errors', () => {
    let error: any

    service.getEventLog(deviceId).subscribe({ error: (err) => (error = err) })

    httpMock
      .expectOne(`${baseUrl}/event/${deviceId}?$skip=0&$top=120`)
      .flush('failed', { status: 500, statusText: 'Server Error' })
    expect(error.status).toBe(500)
  })
})
