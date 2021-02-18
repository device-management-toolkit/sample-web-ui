/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'

import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let httpClientSpy: { get: jasmine.Spy }

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get'])

    TestBed.configureTestingModule({})
    service = new AuthService(httpClientSpy as any)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
