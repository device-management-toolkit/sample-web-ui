/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of, throwError } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DownloadRpcComponent } from './download-rpc.component'
import { DownloadRpcService } from './download-rpc.service'
import { ProfilesService } from '../profiles/profiles.service'
import { DomainsService } from '../domains/domains.service'
import { RpcRelease } from './download-rpc.constants'
import { ACM_ACTIVATION } from '../profiles/profiles.constants'

describe('DownloadRpcComponent', () => {
  let component: DownloadRpcComponent
  let fixture: ComponentFixture<DownloadRpcComponent>
  let downloadServiceSpy: jasmine.SpyObj<DownloadRpcService>
  let profilesServiceSpy: jasmine.SpyObj<ProfilesService>
  let domainsServiceSpy: jasmine.SpyObj<DomainsService>
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>

  const releases: RpcRelease[] = [
    { version: 'v3.0.1', assets: [{ os: 'linux', arch: 'x86_64' }, { os: 'windows', arch: 'x86_64' }] }
  ]

  beforeEach(() => {
    downloadServiceSpy = jasmine.createSpyObj('DownloadRpcService', ['getVersions', 'buildPackage'])
    profilesServiceSpy = jasmine.createSpyObj('ProfilesService', ['getData'])
    domainsServiceSpy = jasmine.createSpyObj('DomainsService', ['getData'])
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])
    downloadServiceSpy.getVersions.and.returnValue(of(releases))
    downloadServiceSpy.buildPackage.and.returnValue(of(new Blob(['zip'], { type: 'application/zip' })))
    profilesServiceSpy.getData.and.returnValue(
      of({
        data: [
          { profileName: 'acmProfile', activation: ACM_ACTIVATION } as any,
          { profileName: 'ccmProfile', activation: 'ccmactivate' } as any
        ],
        totalCount: 2
      })
    )
    domainsServiceSpy.getData.and.returnValue(
      of({ data: [{ profileName: 'dom1', domainSuffix: 'd.com' } as any], totalCount: 1 })
    )

    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, DownloadRpcComponent, TranslateModule.forRoot()],
      providers: [
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

  it('should create and load versions, profiles, domains', () => {
    expect(component).toBeTruthy()
    expect(downloadServiceSpy.getVersions).toHaveBeenCalled()
    expect(profilesServiceSpy.getData).toHaveBeenCalled()
    expect(domainsServiceSpy.getData).toHaveBeenCalled()
    expect(component.releases.length).toBe(1)
  })

  it('defaults command to activate and auth to token', () => {
    expect(component.form.get('command')?.value).toBe('activate')
    expect(component.form.get('authMode')?.value).toBe('token')
  })

  it('requires username/password only when auth is userpass', () => {
    component.form.get('authMode')?.setValue('token')
    component.onAuthModeChange()
    expect(component.form.get('username')?.hasError('required')).toBeFalse()
    component.form.get('authMode')?.setValue('userpass')
    component.onAuthModeChange()
    expect(component.form.get('username')?.hasError('required')).toBeTrue()
    expect(component.form.get('password')?.hasError('required')).toBeTrue()
  })

  it('requires domain only when activate + ACM profile selected', () => {
    component.form.get('command')?.setValue('activate')
    component.form.get('profile')?.setValue('ccmProfile')
    component.onProfileOrCommandChange()
    expect(component.isAcmSelected).toBeFalse()
    expect(component.form.get('domain')?.hasError('required')).toBeFalse()

    component.form.get('profile')?.setValue('acmProfile')
    component.onProfileOrCommandChange()
    expect(component.isAcmSelected).toBeTrue()
    expect(component.form.get('domain')?.hasError('required')).toBeTrue()
  })

  it('clears profile/domain requirements for deactivate', () => {
    component.form.get('command')?.setValue('deactivate')
    component.onProfileOrCommandChange()
    expect(component.form.get('profile')?.hasError('required')).toBeFalse()
    expect(component.form.get('domain')?.hasError('required')).toBeFalse()
  })

  it('selectedRelease exposes assets for the chosen version', () => {
    component.form.get('version')?.setValue('v3.0.1')
    component.onVersionChange()
    expect(component.availableAssets.length).toBe(2)
    expect(component.form.get('os')?.value).toBe('linux')
    expect(component.form.get('arch')?.value).toBe('x86_64')
  })

  it('onSubmit posts a token activate request and triggers a download', () => {
    const anchorSpy = document.createElement('a')
    spyOn(anchorSpy, 'click')
    spyOn(document, 'createElement').and.returnValue(anchorSpy as any)
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url')
    spyOn(window.URL, 'revokeObjectURL')

    component.form.setValue({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'token',
      username: '',
      password: '',
      profile: 'ccmProfile',
      domain: ''
    })
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'token' },
      profile: 'ccmProfile'
    })
    expect(anchorSpy.click).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url')
  })

  it('onSubmit includes domain for ACM and username/password for userpass', () => {
    spyOn(component as any, 'saveBlob')
    component.form.setValue({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'userpass',
      username: 'admin',
      password: 'secret',
      profile: 'acmProfile',
      domain: 'dom1'
    })
    component.onAuthModeChange()
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'activate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'userpass', username: 'admin', password: 'secret' },
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
    spyOn(component as any, 'saveBlob')
    component.form.setValue({
      command: 'deactivate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'token',
      username: '',
      password: '',
      profile: '',
      domain: ''
    })
    component.onAuthModeChange()
    component.onProfileOrCommandChange()
    component.onSubmit()

    expect(downloadServiceSpy.buildPackage).toHaveBeenCalledWith({
      command: 'deactivate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      auth: { mode: 'token' }
    })
  })

  it('shows an error when buildPackage fails', () => {
    downloadServiceSpy.buildPackage.and.returnValue(throwError(() => ['fail']))
    snackBarSpy.open.calls.reset()
    component.form.setValue({
      command: 'deactivate',
      version: 'v3.0.1',
      os: 'linux',
      arch: 'x86_64',
      authMode: 'token',
      username: '',
      password: '',
      profile: '',
      domain: ''
    })
    component.onAuthModeChange()
    component.onProfileOrCommandChange()
    component.onSubmit()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })
})
