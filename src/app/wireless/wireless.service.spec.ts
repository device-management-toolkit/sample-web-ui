import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { AuthService } from '../auth.service'

import { WirelessService } from './wireless.service'

describe('WirelessService', () => {
  let service: WirelessService
  let httpClientSpy: { get: jasmine.Spy }
  let routerSpy

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({})
    service = new WirelessService(httpClientSpy as any, new AuthService(httpClientSpy as any, routerSpy as Router))
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
