/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { AuthService } from '../auth.service'

import { ProfilesService } from './profiles.service'

describe('ProfilesService', () => {
  let service: ProfilesService
  let httpClientSpy: { get: jasmine.Spy, post: jasmine.Spy, patch: jasmine.Spy, delete: jasmine.Spy }
  let routerSpy
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new ProfilesService(new AuthService(httpClientSpy as any, routerSpy as Router), httpClientSpy as any)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should load all the profiles when get all profile request fired', (done: DoneFn) => {
    const profileResponse = {
      data: [{
        profileName: 'profile1',
        amtPassword: null,
        configurationScript: null,
        activation: 'acmactivate',
        ciraConfigName: 'config1',
        dhcpEnabled: true,
        mebxPassword: 'password',
        tags: ['acm'],
        wifiConfigs: []
      }],
      totalCount: 1
    }

    httpClientSpy.get.and.returnValue(of(profileResponse))

    service.getData().subscribe(response => {
      expect(response).toEqual(profileResponse)
      done()
    })

    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should return a specific profile when a single profile is requested', (done: DoneFn) => {
    const profileResponse = {
      profileName: 'profile1',
      amtPassword: null,
      configurationScript: null,
      activation: 'acmactivate',
      ciraConfigName: 'config1',
      dhcpEnabled: true,
      mebxPassword: 'password',
      tags: ['acm'],
      wifiConfigs: []
    }

    httpClientSpy.get.and.returnValue(of(profileResponse))

    service.getRecord('profile1').subscribe(response => {
      expect(response).toEqual(profileResponse)
      done()
    })
  })

  it('should delete the specified profile when a delete request fires', (done: DoneFn) => {
    httpClientSpy.delete.and.returnValue(of({}))

    service.delete('profile1').subscribe(() => {
      done()
    })

    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should create the profile when post request gets fired', (done: DoneFn) => {
    const profileReq = {
      profileName: 'profile1',
      amtPassword: null,
      configurationScript: null,
      activation: 'acmactivate',
      ciraConfigName: 'config1',
      dhcpEnabled: true,
      mebxPassword: 'password',
      tags: ['acm'],
      wifiConfigs: []
    }

    httpClientSpy.post.and.returnValue(of(profileReq))

    service.create(profileReq).subscribe(response => {
      expect(response).toEqual(profileReq)
      done()
    })

    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })

  it('should update the profile when a patch request fired', (done: DoneFn) => {
    const profileReq = {
      profileName: 'profile1',
      amtPassword: null,
      configurationScript: null,
      activation: 'acmactivate',
      ciraConfigName: 'config1',
      dhcpEnabled: true,
      mebxPassword: 'password',
      tags: ['acm'],
      wifiConfigs: []
    }

    httpClientSpy.patch.and.returnValue(of(profileReq))

    service.update(profileReq).subscribe(response => {
      expect(response).toEqual(profileReq)
      done()
    })

    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })
})
