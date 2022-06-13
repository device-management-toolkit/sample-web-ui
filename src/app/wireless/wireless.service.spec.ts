/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { PageEventOptions } from 'src/models/models'
import { AuthService } from '../auth.service'

import { WirelessService } from './wireless.service'

describe('WirelessService', () => {
  let service: WirelessService
  let httpClientSpy: { get: jasmine.Spy, post: jasmine.Spy, patch: jasmine.Spy, delete: jasmine.Spy }
  let routerSpy

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new WirelessService(httpClientSpy as any, new AuthService(httpClientSpy as any, routerSpy as Router))
  })

  const wifiResponse = {
    data: [{
      profileName: 'wifi1',
      authenticationMethod: 3,
      encryptionMethod: 4,
      ssid: 'ssid',
      pskValue: 'password',
      linkPolicy: [14]
    }],
    totalCount: 1
  }

  const wifiReq = {
    profileName: 'wifi1',
    authenticationMethod: 3,
    encryptionMethod: 4,
    ssid: 'ssid',
    pskValue: 'password',
    linkPolicy: [14]
  }

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should load all the wifi configs when get all request fired', () => {
    httpClientSpy.get.and.returnValue(of(wifiResponse))

    service.getData().subscribe(response => {
      expect(response).toEqual(wifiResponse)
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should load all the wifi configs when get all request fired with pageevent options', () => {
    const pageEvent: PageEventOptions = {
      count: 'true',
      pageSize: 20,
      startsFrom: 10,
      tags: []
    }
    httpClientSpy.get.and.returnValue(of(wifiResponse))

    service.getData(pageEvent).subscribe(response => {
      expect(response).toEqual(wifiResponse)
    })
    const params = httpClientSpy.get.calls.allArgs()[0][0].split('?')[1]
    expect('$top=20&$skip=10&$count=true').toEqual(params)
    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should throw errors when get all request fired with pageevent options', () => {
    const pageEvent: PageEventOptions = {
      count: 'true',
      pageSize: 20,
      startsFrom: 10,
      tags: []
    }

    const error = {
      status: 404,
      message: 'Not Found'
    }

    httpClientSpy.get.and.returnValue(throwError(error))

    service.getData(pageEvent).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should load the specific wifi configs when get single record request fired', () => {
    const wifiResponse = {
      profileName: 'wifi1',
      authenticationMethod: 3,
      encryptionMethod: 4,
      ssid: 'ssid',
      pskValue: 'password',
      linkPolicy: [14]
    }

    httpClientSpy.get.and.returnValue(of(wifiResponse))

    service.getRecord('wifi1').subscribe(response => {
      expect(response).toEqual(wifiResponse)
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })
  it('should throw error when get single record request fired', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }

    httpClientSpy.get.and.returnValue(throwError(error))

    service.getRecord('wifi1').subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should delete the wifi config when delete request fires', () => {
    httpClientSpy.delete.and.returnValue(of({}))

    service.delete('wifi1').subscribe(() => {
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should throw error when delete request fires', () => {
    const error = { error: 'Not Found' }
    httpClientSpy.delete.and.returnValue(throwError(error))

    service.delete('wifi1').subscribe(() => {}, (err) => {
      expect(err).toEqual([error])
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should create the wireless config when create request gets fired', () => {
    httpClientSpy.post.and.returnValue(of(wifiReq))

    service.create(wifiReq).subscribe(response => {
      expect(response).toEqual(wifiReq)
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })
  it('should throw error when create request gets fired', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }
    httpClientSpy.post.and.returnValue(throwError(error))

    service.create(wifiReq).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })
  it('should update the wireless config when update request gets fired', () => {
    httpClientSpy.patch.and.returnValue(of(wifiReq))

    service.update(wifiReq).subscribe(response => {
      expect(response).toEqual(wifiReq)
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })

  it('should throw error when update request gets fired', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }

    httpClientSpy.patch.and.returnValue(throwError(error))

    service.update(wifiReq).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })
})
