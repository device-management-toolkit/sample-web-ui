/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { provideTranslateService } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DownloadRpcComponent } from './download-rpc.component'
import { DownloadRpcService } from './download-rpc.service'
import { ProfilesService } from '../profiles/profiles.service'
import { DomainsService } from '../domains/domains.service'
import { RpcRelease } from '../../models/models'
import { ACM_ACTIVATION } from '../profiles/profiles.constants'
import { environment } from '../../environments/environment'

describe('DownloadRpcComponent', () => {
  let component: DownloadRpcComponent
  let fixture: ComponentFixture<DownloadRpcComponent>
  let downloadServiceSpy: SpyObj<DownloadRpcService>
  let profilesServiceSpy: SpyObj<ProfilesService>
  let domainsServiceSpy: SpyObj<DomainsService>
  let snackBarSpy: SpyObj<MatSnackBar>
  let originalRpsServer: string

  const releases: RpcRelease[] = [
    {
      version: 'v3.0.1',
      assets: [
        { os: 'linux', arch: 'x64' },
        { os: 'linux', arch: 'x86' },
        { os: 'windows', arch: 'x64' }
      ]
    }
  ]

  beforeEach(() => {
    // Other specs share this environment object and do not always restore it.
    originalRpsServer = environment.rpsServer
    environment.rpsServer = 'https://console.example:8181'
    downloadServiceSpy = createSpyObj('DownloadRpcService', ['getVersions', 'buildPackage'])
    profilesServiceSpy = createSpyObj('ProfilesService', ['getData'])
    domainsServiceSpy = createSpyObj('DomainsService', ['getData'])
    snackBarSpy = createSpyObj('MatSnackBar', ['open'])
    downloadServiceSpy.getVersions.mockReturnValue(of(releases))
    downloadServiceSpy.buildPackage.mockReturnValue(of(new Blob(['zip'], { type: 'application/zip' })))
    profilesServiceSpy.getData.mockReturnValue(
      of({
        data: [
          { profileName: 'acmProfile', activation: ACM_ACTIVATION } as any,
          { profileName: 'ccmProfile', activation: 'ccmactivate' } as any
        ],
        totalCount: 2
      })
    )
    domainsServiceSpy.getData.mockReturnValue(
      of({ data: [{ profileName: 'dom1', domainSuffix: 'd.com' } as any], totalCount: 1 })
    )

    TestBed.configureTestingModule({
      imports: [DownloadRpcComponent],
      providers: [
        provideTranslateService(),
        { provide: DownloadRpcService, useValue: downloadServiceSpy },
        { provide: ProfilesService, useValue: profilesServiceSpy },
        { provide: DomainsService, useValue: domainsServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    fixture = TestBed.createComponent(DownloadRpcComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    environment.rpsServer = originalRpsServer
  })

  it('should create and load versions, profiles, domains', () => {
    expect(component).toBeTruthy()
    expect(downloadServiceSpy.getVersions).toHaveBeenCalled()
    expect(profilesServiceSpy.getData).toHaveBeenCalled()
    expect(domainsServiceSpy.getData).toHaveBeenCalled()
    expect(component.releases().length).toBe(1)
  })

  it('defaults command to activate and auth to no credentials', () => {
    expect(component.form.get('command')?.value).toBe('activate')
    expect(component.form.get('authMode')?.value).toBe('none')
  })

  it('offers only no-credentials and token auth, no-credentials first', () => {
    expect(component.authMethods.map((m) => m.value)).toEqual(['none', 'token'])
  })

  it('defaults the token lifetime to one hour', () => {
    expect(component.form.get('tokenTtl')?.value).toBe('1h')
  })

  it('sends the chosen token lifetime for token auth', () => {
    vi.spyOn(component as any, 'saveBlob').mockImplementation(() => undefined)
    component.form.get('authMode')?.setValue('token')
    component.form.get('tokenTtl')?.setValue('15m')
    component.form.get('profile')?.setValue('ccmProfile')
    component.form.get('version')?.setValue('v3.0.1')
    component.form.get('os')?.setValue('linux')
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith(expect.objectContaining({ tokenTtl: '15m' }))
  })

  it('sends mode none with no credentials and no token lifetime by default', () => {
    vi.spyOn(component as any, 'saveBlob').mockImplementation(() => undefined)
    component.form.patchValue({
      version: 'v3.0.1',
      os: 'linux',
      profile: 'ccmProfile'
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    const sent = downloadServiceSpy.buildPackage.mock.calls[0][0]
    expect(sent.auth).toEqual({ mode: 'none' })
    expect(sent.tokenTtl).toBeUndefined()
  })

  it('shows the no-credentials note only when no credentials are selected', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="noCredentialsNote"]')).toBeTruthy()
    expect(fixture.nativeElement.querySelector('[data-cy="tokenTtl"]')).toBeNull()

    component.form.get('authMode')?.setValue('token')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="noCredentialsNote"]')).toBeNull()
    expect(fixture.nativeElement.querySelector('[data-cy="tokenTtl"]')).toBeTruthy()
  })

  it('renders no username or password fields', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="username"]')).toBeNull()
    expect(fixture.nativeElement.querySelector('[data-cy="password"]')).toBeNull()
    expect(component.form.get('username')).toBeNull()
    expect(component.form.get('password')).toBeNull()
  })

  it('marks the page as a preview feature', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="previewChip"]')?.textContent).toContain(
      'downloadRpc.preview.value'
    )
  })

  it('explains what the package is and how to run it', () => {
    fixture.detectChanges()
    const text = fixture.nativeElement.querySelector('[data-cy="intro"]')?.textContent
    expect(text).toContain('downloadRpc.intro.contents.value')
    expect(text).toContain('downloadRpc.intro.usage.value')
    expect(fixture.nativeElement.querySelector('mat-card-subtitle')?.textContent).toContain(
      'downloadRpc.subtitle.value'
    )
  })

  it('pre-fills serverUrl with the API base the UI talks to', () => {
    expect(component.form.get('serverUrl')?.value).toBe('https://console.example:8181')
  })

  it('rejects a serverUrl that is not an absolute http(s) URL', () => {
    const control = component.form.get('serverUrl')
    control?.setValue('console.example:8181')
    expect(control?.hasError('serverUrl')).toBe(true)
    control?.setValue('')
    expect(control?.hasError('required')).toBe(true)
    control?.setValue('https://console.example:8181')
    expect(control?.valid).toBe(true)
  })

  it('flags loopback server URLs and accepts reachable ones', () => {
    const control = component.form.get('serverUrl')
    for (const local of [
      'http://localhost:8181',
      'https://127.0.0.1',
      'http://0.0.0.0:8181'
    ]) {
      control?.setValue(local)
      expect(component.isLoopbackServerUrl()).toBe(true)
    }
    control?.setValue('https://console.example:8181')
    expect(component.isLoopbackServerUrl()).toBe(false)
    control?.setValue('not a url')
    expect(component.isLoopbackServerUrl()).toBe(false)
  })

  it('renders the loopback warning only while the URL is local', () => {
    component.form.get('serverUrl')?.setValue('http://localhost:8181')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="serverUrlLocalWarning"]')).toBeTruthy()

    component.form.get('serverUrl')?.setValue('https://console.example:8181')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="serverUrlLocalWarning"]')).toBeNull()
  })

  it('does not submit when serverUrl is invalid', () => {
    component.form.get('serverUrl')?.setValue('not a url')
    component.onSubmit()
    expect(downloadServiceSpy.buildPackage).not.toHaveBeenCalled()
  })

  it('requires domain only when activate + ACM profile selected', () => {
    component.form.get('command')?.setValue('activate')
    component.form.get('profile')?.setValue('ccmProfile')
    component.onProfileOrCommandChange()
    expect(component.isAcmSelected()).toBe(false)
    expect(component.form.get('domain')?.hasError('required')).toBe(false)

    component.form.get('profile')?.setValue('acmProfile')
    component.onProfileOrCommandChange()
    expect(component.isAcmSelected()).toBe(true)
    expect(component.form.get('domain')?.hasError('required')).toBe(true)
  })

  it('clears profile/domain requirements for deactivate', () => {
    component.form.get('command')?.setValue('deactivate')
    component.onProfileOrCommandChange()
    expect(component.form.get('profile')?.hasError('required')).toBe(false)
    expect(component.form.get('domain')?.hasError('required')).toBe(false)
  })

  it('defaults the version and profile to the first ones loaded', () => {
    expect(component.form.get('version')?.value).toBe('v3.0.1')
    expect(component.form.get('os')?.value).toBe('windows')
    expect(component.form.get('profile')?.value).toBe('acmProfile')
    expect(component.isAcmSelected()).toBe(true)
  })

  it('offers only OSes with an x64 build, Windows first, and both when each has one', () => {
    component.releases.set([
      {
        version: 'v3.0.2',
        assets: [
          { os: 'linux', arch: 'x86' },
          { os: 'windows', arch: 'x64' }
        ]
      }
    ])
    component.form.get('version')?.setValue('v3.0.2')
    component.onVersionChange()
    expect(component.availableOses().map((o) => o.value)).toEqual(['windows'])

    component.form.get('version')?.setValue('v3.0.1')
    component.releases.set(releases)
    component.onVersionChange()
    expect(component.availableOses().map((o) => o.value)).toEqual([
      'windows',
      'linux',
      'both'
    ])
  })

  it('sends os both when Windows and Linux are chosen', () => {
    vi.spyOn(component as any, 'saveBlob').mockImplementation(() => undefined)
    component.form.patchValue({ os: 'both', profile: 'ccmProfile' })
    component.onProfileOrCommandChange()
    component.onSubmit()
    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith(expect.objectContaining({ os: 'both', arch: 'x64' }))
  })

  it('renders no architecture field', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-cy="arch"]')).toBeNull()
    expect(component.form.get('arch')).toBeNull()
  })

  it('onSubmit posts a token activate request and triggers a download', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url')
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined)

    component.form.setValue({
      command: 'activate',
      serverUrl: 'http://console.example:8181',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      authMode: 'token',
      profile: 'ccmProfile',
      domain: ''
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'activate',
      serverUrl: 'http://console.example:8181',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x64',
      auth: { mode: 'token' },
      profile: 'ccmProfile'
    })
    expect(clickSpy).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url')
  })

  it('onSubmit includes domain for ACM and no credentials for mode none', () => {
    vi.spyOn(component as any, 'saveBlob').mockImplementation(() => undefined)
    component.form.setValue({
      command: 'activate',
      serverUrl: 'http://console.example:8181',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      authMode: 'none',
      profile: 'acmProfile',
      domain: 'dom1'
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'activate',
      serverUrl: 'http://console.example:8181',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x64',
      auth: { mode: 'none' },
      profile: 'acmProfile',
      domain: 'dom1'
    })
  })

  it('does not submit an invalid form', () => {
    component.form.get('version')?.setValue('')
    component.form.get('command')?.setValue('activate')
    component.onProfileOrCommandChange()
    component.onSubmit()
    expect(downloadServiceSpy.buildPackage).not.toHaveBeenCalled()
  })

  it('deactivate submit omits profile and domain from request', () => {
    vi.spyOn(component as any, 'saveBlob').mockImplementation(() => undefined)
    component.form.setValue({
      command: 'deactivate',
      serverUrl: 'http://console.example:8181',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      authMode: 'token',
      profile: '',
      domain: ''
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'deactivate',
      serverUrl: 'http://console.example:8181',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x64',
      auth: { mode: 'token' }
    })
  })

  it('trims surrounding whitespace from serverUrl before posting', () => {
    vi.spyOn(component as any, 'saveBlob').mockImplementation(() => undefined)
    component.form.setValue({
      serverUrl: '  https://console.example:8181  ',
      command: 'deactivate',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      authMode: 'token',
      profile: '',
      domain: ''
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith(
      expect.objectContaining({ serverUrl: 'https://console.example:8181' })
    )
  })

  it('shows an error when buildPackage fails', () => {
    downloadServiceSpy.buildPackage.mockReturnValue(throwError(() => ['fail']))
    snackBarSpy.open.mockClear()
    component.form.setValue({
      command: 'deactivate',
      serverUrl: 'http://console.example:8181',
      tokenTtl: '1h',
      version: 'v3.0.1',
      os: 'linux',
      authMode: 'token',
      profile: '',
      domain: ''
    })
    component.onProfileOrCommandChange()
    component.onSubmit()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })
})
