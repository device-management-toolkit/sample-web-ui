/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { environment } from 'src/environments/environment'
import { AuthService } from '../auth.service'

import { DomainsService } from './domains.service'

describe('DomainsService', () => {
  let service: DomainsService
  let httpClientSpy: { get: jasmine.Spy, patch: jasmine.Spy, post: jasmine.Spy, delete: jasmine.Spy }
  let routerSpy
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'patch', 'post', 'delete'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new DomainsService(new AuthService(httpClientSpy as any, routerSpy as Router), httpClientSpy as any)
  })

  const domainReq = {
    profileName: 'testDomain',
    domainSuffix: 'testDomain.com',
    provisioningCert: 'domainCertLongText',
    provisioningCertPassword: 'password',
    provisioningCertStorageFormat: 'string'
  }

  const domainResponse = {
    data: [domainReq],
    totalCount: 1
  }

  const error = {
    status: 404,
    message: 'Not Found'
  }

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should return array of 25 domains when get all domains called ', () => {
    httpClientSpy.get.and.returnValue(of(domainResponse))

    service.getData({ pageSize: 25, startsFrom: 0, count: 'true' }).subscribe(response => {
      expect(response).toEqual(domainResponse)
    })
    expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.rpsServer}/api/v1/admin/domains?$top=25&$skip=0&$count=true`)
    expect(httpClientSpy.get.calls.count()).toEqual(1, 'one call')
  })

  it('should return array of domains when get all domains called ', () => {
    httpClientSpy.get.and.returnValue(of(domainResponse))

    service.getData().subscribe(response => {
      expect(response).toEqual(domainResponse)
    })
    expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.rpsServer}/api/v1/admin/domains?$count=true`)
    expect(httpClientSpy.get.calls.count()).toEqual(1, 'one call')
  })
  it('should throw errors when get all domains called ', () => {
    httpClientSpy.get.and.returnValue(throwError(error))

    service.getData().subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })
    expect(httpClientSpy.get.calls.count()).toEqual(1, 'one call')
  })

  it('should return a single domain object detail when a single record is requested', () => {
    const domainResponse = {
      profileName: 'testDomain',
      domainSuffix: 'testDomain.com',
      provisioningCert: 'domainCertLongText',
      provisioningCertPassword: 'password',
      provisioningCertStorageFormat: 'string'
    }

    httpClientSpy.get.and.returnValue(of(domainResponse))

    service.getRecord('testDomain').subscribe(response => {
      expect(response).toEqual(domainResponse)
    })
  })

  it('should return errors on a single domain object detail when a single record is requested', () => {
    httpClientSpy.get.and.returnValue(throwError(error))

    service.getRecord('testDomain').subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })
  })

  it('should return the updated domain details when a domain is updated', () => {
    httpClientSpy.patch.and.returnValue(of(domainReq))

    service.update(domainReq).subscribe(response => {
      expect(response).toEqual(domainReq)
    })
  })

  it('should return errors on updated domain details when a domain is updated', () => {
    httpClientSpy.patch.and.returnValue(throwError(error))

    service.update(domainReq).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })
  })

  it('should return the created domain details when a domain is created', () => {
    httpClientSpy.post.and.returnValue(of(domainReq))

    service.create(domainReq).subscribe(response => {
      expect(response).toEqual(domainReq)
    })
  })

  it('should throw error on created domain details when a domain is created', () => {
    httpClientSpy.post.and.returnValue(throwError(error))

    service.create(domainReq).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })
  })

  it('should delete the domain when a delete request is sent', () => {
    const domainName = 'testDomain'

    httpClientSpy.delete.and.returnValue(of({}))

    service.delete(domainName).subscribe(() => {
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should throw error when a delete request is sent', () => {
    const domainName = 'testDomain'
    httpClientSpy.delete.and.returnValue(throwError(error))

    service.delete(domainName).subscribe(() => {}, err => {
      expect(error.status).toBe(err[0].status)
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })
})
