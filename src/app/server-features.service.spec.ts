/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { ServerFeaturesService } from './server-features.service'
import { AuthService } from './auth.service'
import { environment } from '../environments/environment'
import { ServerFeatures } from '../models/models'

describe('ServerFeaturesService', () => {
  let service: ServerFeaturesService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://rps-server' }
  const mockUrl = `${mockEnvironment.rpsServer}/api/v1/server/features`
  let originalRpsServer: string

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    originalRpsServer = environment.rpsServer
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      providers: [
        ServerFeaturesService,
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    service = TestBed.inject(ServerFeaturesService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    environment.rpsServer = originalRpsServer
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getFeatures', () => {
    it('should call the API and return the server features', () => {
      const mockResponse: ServerFeatures = { ciraEnabled: true }

      service.getFeatures().subscribe((response) => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne(mockUrl)
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should handle errors', () => {
      const mockError = { status: 500, statusText: 'Internal Server Error' }
      authServiceSpy.onError.and.returnValue(['Error occurred'])

      service.getFeatures().subscribe({
        error: (error) => {
          expect(error).toEqual(['Error occurred'])
        }
      })

      const req = httpMock.expectOne(mockUrl)
      req.flush(null, mockError)
    })
  })
})
