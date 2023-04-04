/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { PageEventOptions } from 'src/models/models'
import { AuthService } from '../auth.service'

import { IEEE8021xService } from './ieee8021x.service'
import * as IEEE8021x from 'src/app/ieee8021x/ieee8021x.constants'

describe('IEEE8021xService', () => {
  let service: IEEE8021xService
  let httpClientSpy: { get: jasmine.Spy, post: jasmine.Spy, patch: jasmine.Spy, delete: jasmine.Spy }
  let routerSpy

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new IEEE8021xService(httpClientSpy as any, new AuthService(httpClientSpy as any, routerSpy as Router))
  })

  const config01: IEEE8021x.Config = {
    profileName: 'name 1',
    authenticationProtocol: IEEE8021x.AuthenticationProtocols.EAP_TLS.value,
    pxeTimeout: 120,
    wiredInterface: true,
    version: 'one'
  }
  const ieee8021ConfigsResponse: IEEE8021x.ConfigsResponse = {
    data: [config01],
    totalCount: 1
  }

  const ieee8021xRequest = config01

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should load all the configs when get all request fired', () => {
    httpClientSpy.get.and.returnValue(of(ieee8021ConfigsResponse))

    service.getData().subscribe(response => {
      expect(response).toEqual(ieee8021ConfigsResponse)
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should load all the configs when get all request fired with pageevent options', () => {
    const pageEvent: PageEventOptions = {
      count: 'true',
      pageSize: 20,
      startsFrom: 10,
      tags: []
    }
    httpClientSpy.get.and.returnValue(of(ieee8021ConfigsResponse))

    service.getData(pageEvent).subscribe(response => {
      expect(response).toEqual(ieee8021ConfigsResponse)
    })
    const params = httpClientSpy.get.calls.allArgs()[0][0].split('?')[1]
    expect('$top=20&$skip=10&$count=true').toEqual(params)
    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should refresh the counts by interface', async () => {
    expect(service.wiredConfigExists).toBeFalse()
    expect(service.wirelessConfigExists).toBeFalse()
    httpClientSpy.get.and.returnValue(of({ wired: 1, wireless: 1 }))
    await service.refreshCountByInterface()
    expect(service.wiredConfigExists).toBeTrue()
    expect(service.wirelessConfigExists).toBeTrue()
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

  it('should load the specific configs when get single record request fired', () => {
    httpClientSpy.get.and.returnValue(of(config01))
    service.getRecord(config01.profileName).subscribe(response => {
      expect(response).toEqual(config01)
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

  it('should delete the config when delete request fires', () => {
    httpClientSpy.delete.and.returnValue(of({}))
    service.delete(config01.profileName).subscribe(() => {})
    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should throw error when delete request fires', () => {
    const error = { error: 'Not Found' }
    httpClientSpy.delete.and.returnValue(throwError(error))
    service.delete(config01.profileName).subscribe(() => {}, (err) => {
      expect(err).toEqual([error])
    })
    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should create the ieee8021x config when create request gets fired', () => {
    httpClientSpy.post.and.returnValue(of(ieee8021xRequest))

    service.create(ieee8021xRequest).subscribe(response => {
      expect(response).toEqual(ieee8021xRequest)
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })
  it('should throw error when create request gets fired', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }
    httpClientSpy.post.and.returnValue(throwError(error))

    service.create(ieee8021xRequest).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })
  it('should update the ieee8021x config when update request gets fired', () => {
    httpClientSpy.patch.and.returnValue(of(ieee8021xRequest))

    service.update(ieee8021xRequest).subscribe(response => {
      expect(response).toEqual(ieee8021xRequest)
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })

  it('should throw error when update request gets fired', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }

    httpClientSpy.patch.and.returnValue(throwError(error))

    service.update(ieee8021xRequest).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })
})
