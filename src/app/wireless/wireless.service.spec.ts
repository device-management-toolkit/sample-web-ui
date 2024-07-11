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
import { AuthenticationMethods, Config, EncryptionMethods } from './wireless.constants'

describe('WirelessService', () => {
  let service: WirelessService
  let httpClientSpy: { get: jasmine.Spy; post: jasmine.Spy; patch: jasmine.Spy; delete: jasmine.Spy }
  let routerSpy

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', [
      'get',
      'post',
      'patch',
      'delete'
    ])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})

    service = new WirelessService(httpClientSpy as any, new AuthService(httpClientSpy as any, routerSpy as Router))
  })

  const config01: Config = {
    profileName: 'wirelessConfig01',
    ssid: 'someSSID',
    authenticationMethod: AuthenticationMethods.WPA_PSK.value,
    encryptionMethod: EncryptionMethods.TKIP.value,
    pskPassphrase: 'onlyInRequestNotRESPONSE'
  }

  const wifiResponse = {
    data: [config01],
    totalCount: 1
  }

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should load all the wifi configs when get all request fired', (done) => {
    httpClientSpy.get.and.returnValue(of(wifiResponse))

    service.getData().subscribe((response) => {
      expect(response).toEqual(wifiResponse)
      done()
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should load all the wifi configs when get all request fired with pageevent options', (done) => {
    const pageEvent: PageEventOptions = {
      count: 'true',
      pageSize: 20,
      startsFrom: 10,
      tags: []
    }
    httpClientSpy.get.and.returnValue(of(wifiResponse))

    service.getData(pageEvent).subscribe((response) => {
      expect(response).toEqual(wifiResponse)
      done()
    })
    const params = httpClientSpy.get.calls.allArgs()[0][0].split('?')[1]
    expect('$top=20&$skip=10&$count=true').toEqual(params)
    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should throw errors when get all request fired with pageevent options', (done) => {
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

    service.getData(pageEvent).subscribe(
      () => {},
      (err) => {
        expect(error.status).toBe(err[0].status)
        done()
      }
    )

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should load the specific wifi configs when get single record request fired', (done) => {
    const wifiResponse = {
      profileName: 'wifi1',
      authenticationMethod: 3,
      encryptionMethod: 4,
      ssid: 'ssid',
      pskValue: 'password',
      linkPolicy: [14]
    }

    httpClientSpy.get.and.returnValue(of(wifiResponse))

    service.getRecord('wifi1').subscribe((response) => {
      expect(response).toEqual(wifiResponse)
      done()
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })
  it('should throw error when get single record request fired', (done) => {
    const error = {
      status: 404,
      message: 'Not Found'
    }

    httpClientSpy.get.and.returnValue(throwError(error))

    service.getRecord('wifi1').subscribe(
      () => {},
      (err) => {
        expect(error.status).toBe(err[0].status)
        done()
      }
    )

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should delete the wifi config when delete request fires', (done) => {
    httpClientSpy.delete.and.returnValue(of({}))

    service.delete('wifi1').subscribe(() => {
      done()
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should throw error when delete request fires', (done) => {
    const error = { error: 'Not Found' }
    httpClientSpy.delete.and.returnValue(throwError(error))

    service.delete('wifi1').subscribe(
      () => {},
      (err) => {
        expect(err).toEqual([error])
        done()
      }
    )

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should create the wireless config when create request gets fired', (done) => {
    httpClientSpy.post.and.returnValue(of(config01))

    service.create(config01).subscribe((response) => {
      expect(response).toEqual(config01)
      done()
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })
  it('should throw error when create request gets fired', (done) => {
    const error = {
      status: 404,
      message: 'Not Found'
    }
    httpClientSpy.post.and.returnValue(throwError(error))

    service.create(config01).subscribe(
      () => {},
      (err) => {
        expect(error.status).toBe(err[0].status)
        done()
      }
    )

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })
  it('should update the wireless config when update request gets fired', (done) => {
    httpClientSpy.patch.and.returnValue(of(config01))

    service.update(config01).subscribe((response) => {
      expect(response).toEqual(config01)
      done()
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })

  it('should throw error when update request gets fired', (done) => {
    const error = {
      status: 404,
      message: 'Not Found'
    }

    httpClientSpy.patch.and.returnValue(throwError(error))

    service.update(config01).subscribe(
      () => {},
      (err) => {
        expect(error.status).toBe(err[0].status)
        done()
      }
    )

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })
})
