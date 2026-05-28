/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule } from '@ngx-translate/core'
import { DownloadRpcService } from './download-rpc.service'
import { AuthService } from '../auth.service'
import { environment } from '../../environments/environment'
import { PackageRequest, RpcRelease } from './download-rpc.constants'

describe('DownloadRpcService', () => {
  let service: DownloadRpcService
  let httpMock: HttpTestingController
  let authServiceSpy: jasmine.SpyObj<AuthService>

  const mockEnvironment = { rpsServer: 'https://test-server' }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['onError'])
    environment.rpsServer = mockEnvironment.rpsServer
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        DownloadRpcService,
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    service = TestBed.inject(DownloadRpcService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getVersions should GET the rpc-versions endpoint', () => {
    const mockReleases: RpcRelease[] = [
      { version: 'v3.0.1', assets: [{ os: 'linux', arch: 'x86_64' }] }
    ]
    service.getVersions().subscribe((res) => {
      expect(res).toEqual(mockReleases)
    })
    const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/package/rpc-versions`)
    expect(req.request.method).toBe('GET')
    req.flush(mockReleases)
  })

  it('buildPackage should POST the request and return a blob', () => {
    const body: PackageRequest = {
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'token' },
      profile: 'p1'
    }
    const blob = new Blob(['zip'], { type: 'application/zip' })
    service.buildPackage(body).subscribe((res) => {
      expect(res).toEqual(blob)
    })
    const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/package`)
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(body)
    expect(req.request.responseType).toBe('blob')
    req.flush(blob)
  })

  it('getVersions should route errors through AuthService.onError', () => {
    authServiceSpy.onError.and.returnValue(['boom'])
    service.getVersions().subscribe({
      error: (err) => {
        expect(err).toEqual(['boom'])
      }
    })
    const req = httpMock.expectOne(`${mockEnvironment.rpsServer}/api/package/rpc-versions`)
    req.flush('error', { status: 500, statusText: 'Server Error' })
    expect(authServiceSpy.onError).toHaveBeenCalled()
  })
})
