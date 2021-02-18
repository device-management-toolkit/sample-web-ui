/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'
import { AuthService } from '../auth.service'

import { ProfilesService } from './profiles.service'

describe('ProfilesService', () => {
  let service: ProfilesService
  let httpClientSpy: { get: jasmine.Spy }

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get'])

    TestBed.configureTestingModule({})
    service = new ProfilesService(new AuthService(httpClientSpy as any), httpClientSpy as any)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
