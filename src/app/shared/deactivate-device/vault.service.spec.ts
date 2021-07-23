/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/auth.service'
import { VaultService } from './vault.service'

describe('VaultService', () => {
  let service: VaultService
  let httpClientSpy: { get: jasmine.Spy }
  let routerSpy
  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new VaultService(httpClientSpy as any, new AuthService(httpClientSpy as any, routerSpy as Router))
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
