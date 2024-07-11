/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { AuthService } from '../auth.service'

import { ConfigsService } from './configs.service'

describe('ConfigsService', () => {
  let service: ConfigsService
  let httpClientSpy: { get: jasmine.Spy; post: jasmine.Spy; patch: jasmine.Spy; delete: jasmine.Spy }
  let routerSpy
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', [
      'get',
      'post',
      'delete',
      'patch'
    ])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})

    service = new ConfigsService(new AuthService(httpClientSpy as any, routerSpy as Router), httpClientSpy as any)
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should return all the configs when requested for all configs', (done: DoneFn) => {
    const configResponse = {
      data: [
        {
          configName: 'config1',
          mpsServerAddress: '255.255.255.1',
          mpsPort: 4433,
          username: 'admin',
          password: 'password',
          commonName: '255.255.255.1',
          serverAddressFormat: 3,
          authMethod: 2,
          mpsRootCertificate: 'mpsrootcertificate',
          proxyDetails: ''
        }
      ],
      totalCount: 1
    }

    httpClientSpy.get.and.returnValue(of(configResponse))

    service.getData().subscribe((response) => {
      expect(response).toEqual(configResponse)
      done()
    })
  })

  it('should return the specific config detail when requested with name', (done: DoneFn) => {
    const configResponse = {
      configName: 'config1',
      mpsServerAddress: '255.255.255.1',
      mpsPort: 4433,
      username: 'admin',
      password: 'password',
      commonName: '255.255.255.1',
      serverAddressFormat: 3,
      authMethod: 2,
      mpsRootCertificate: 'mpsrootcertificate',
      proxyDetails: ''
    }

    httpClientSpy.get.and.returnValue(of(configResponse))

    service.getRecord('config1').subscribe((response) => {
      expect(response).toEqual(configResponse)
      done()
    })
  })

  it('should delete the specified config when a delete request fired', (done: DoneFn) => {
    httpClientSpy.delete.and.returnValue(of({}))

    service.delete('config1').subscribe(() => {
      done()
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should create the config when a post request is fired', (done: DoneFn) => {
    const configReq = {
      configName: 'config1',
      mpsServerAddress: '255.255.255.1',
      mpsPort: 4433,
      username: 'admin',
      password: 'password',
      commonName: '255.255.255.1',
      serverAddressFormat: 3,
      authMethod: 2,
      mpsRootCertificate: 'mpsrootcertificate',
      proxyDetails: ''
    }

    httpClientSpy.post.and.returnValue(of(configReq))

    service.create(configReq).subscribe((response) => {
      expect(response).toEqual(configReq)
      done()
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })

  it('should update the config when a update request is fired', (done: DoneFn) => {
    const configReq = {
      configName: 'config1',
      mpsServerAddress: '255.255.255.1',
      mpsPort: 4433,
      username: 'admin',
      password: 'password',
      commonName: '255.255.255.1',
      serverAddressFormat: 3,
      authMethod: 2,
      mpsRootCertificate: 'mpsrootcertificate',
      proxyDetails: ''
    }

    httpClientSpy.patch.and.returnValue(of(configReq))

    service.update(configReq).subscribe((response) => {
      expect(response).toEqual(configReq)
      done()
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })
})
