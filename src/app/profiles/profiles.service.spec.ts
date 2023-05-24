  /*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { environment } from 'src/environments/environment'
import { AuthService } from '../auth.service'

import { ProfilesService } from './profiles.service'
import { Profile, ProfilesResponse } from './profiles.constants'

describe('ProfilesService', () => {
  let service: ProfilesService
  let httpClientSpy: { get: jasmine.Spy, post: jasmine.Spy, patch: jasmine.Spy, delete: jasmine.Spy }
  let routerSpy

  const profileReq: Profile = {
    profileName: 'profile1',
    activation: 'acmactivate',
    iderEnabled: false,
    kvmEnabled: false,
    solEnabled: false,
    userConsent: '',
    generateRandomPassword: true,
    amtPassword: '',
    generateRandomMEBxPassword: true,
    mebxPassword: 'password',
    dhcpEnabled: true,
    ipSyncEnabled: false,
    ieee8021xProfileName: '',
    wifiConfigs: [],
    tags: ['acm'],
    tlsMode: 1,
    tlsSigningAuthority: 'SelfSigned',
    ciraConfigName: 'config1'
  }

  const profileResponse: ProfilesResponse = {
    data: [profileReq],
    totalCount: 1
  }

  const error = {
    status: 404,
    message: 'Not Found',
    error: 'Not Found'
  }

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new ProfilesService(new AuthService(httpClientSpy as any, routerSpy as Router), httpClientSpy as any)
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should load all the profiles when get all profile request fired', () => {
    httpClientSpy.get.and.returnValue(of(profileResponse))

    service.getData().subscribe(response => {
      expect(response).toEqual(profileResponse)
    })
    expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.rpsServer}/api/v1/admin/profiles?$count=true`)
    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should load first 25 profiles when get all profile request fired', () => {
    httpClientSpy.get.and.returnValue(of(profileResponse))

    service.getData({ pageSize: 25, count: 'true', startsFrom: 0 }).subscribe(response => {
      expect(response).toEqual(profileResponse)
    })
    expect(httpClientSpy.get).toHaveBeenCalledWith(`${environment.rpsServer}/api/v1/admin/profiles?$top=25&$skip=0&$count=true`)
    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should throw errors when get all profile request fired', () => {
    const error = {
      status: 404,
      message: 'Not Found'
    }
    httpClientSpy.get.and.returnValue(throwError(() => error))
    service.getData().subscribe({
        next: () => {},
        error: (err) => {
          expect(error.status).toEqual(err[0].status)
        }
      })
    expect(httpClientSpy.get.calls.count()).toEqual(1)
  })

  it('should return a specific profile when a single profile is requested', () => {
    httpClientSpy.get.and.returnValue(of(profileReq))
    service.getRecord('profile1').subscribe(response => {
      expect(response).toEqual(profileReq)
    })
  })

  it('should return error specific profile when a single profile is requested', () => {
    httpClientSpy.get.and.returnValue(throwError(error))
    service.getRecord('profile1').subscribe({
        next: () => {},
        error: (err) => {
          expect(error.status).toBe(err[0].status)
        }
      })
  })

  it('should delete the specified profile when a delete request fires', () => {
    httpClientSpy.delete.and.returnValue(of({}))
    service.delete('profile1').subscribe({
        next: () => {},
        error: () => {
          expect(httpClientSpy.delete.calls.count()).toEqual(1)
        }
      })
  })

  it('should throw error specified profile when a delete request fires', () => {
    httpClientSpy.delete.and.returnValue(throwError(error))
    service.delete('profile1').subscribe({
        next: () => {},
        error: (err) => {
          expect(error.error).toEqual(err[0].error)
        }
      })
    expect(httpClientSpy.delete.calls.count()).toEqual(1)
  })

  it('should create the profile when post request gets fired', () => {
    httpClientSpy.post.and.returnValue(of(profileReq))
    service.create(profileReq).subscribe(response => {
      expect(response).toEqual(profileReq)
    })
    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })

  it('should throw error when post request gets fired', () => {
    httpClientSpy.post.and.returnValue(throwError(error))
    service.create(profileReq).subscribe({
        next: () => {},
        error: (err) => {
          expect(error.status).toBe(err[0].status)
        }
      })
    expect(httpClientSpy.post.calls.count()).toEqual(1)
  })

  it('should update the profile when a patch request fired', () => {
    httpClientSpy.patch.and.returnValue(of(profileReq))
    service.update(profileReq).subscribe(response => {
      expect(response).toEqual(profileReq)
    })
    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })

  it('should throw error when a patch request fired', () => {
    httpClientSpy.patch.and.returnValue(throwError(error))
    service.update(profileReq).subscribe({
        next: () => {},
        error: (err) => {
          expect(error.status).toBe(err[0].status)
        }
      })
    expect(httpClientSpy.patch.calls.count()).toEqual(1)
  })
})
