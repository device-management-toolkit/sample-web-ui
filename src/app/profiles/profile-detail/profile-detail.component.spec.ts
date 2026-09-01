/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { Validators } from '@angular/forms'
import { NEVER, of, throwError } from 'rxjs'
import { ConfigsService } from '../../configs/configs.service'
import { WirelessService } from '../../wireless/wireless.service'
import { ProfilesService } from '../profiles.service'
import { IEEE8021xService } from '../../ieee8021x/ieee8021x.service'
import { ProxyConfigsService } from '../../proxy-configs/proxy-configs.service'
import { ServerFeaturesService } from '../../server-features.service'
import { ProfileDetailComponent } from './profile-detail.component'
import { NoCIRAWarningComponent } from '../../shared/no-cira-warning/no-cira-warning.component'
import { Profile } from '../profiles.constants'
import { MatChipInputEvent } from '@angular/material/chips'
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { IEEE8021xConfig } from '../../../models/models'
import { environment } from '../../../environments/environment'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideTranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('ProfileDetailComponent', () => {
  const defaultCloudMode = environment.cloud
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>
  let profileSpy: MockInstance
  let ciraGetDataSpy: MockInstance
  let profileCreateSpy: MockInstance
  let profileUpdateSpy: MockInstance
  const ieee8021xAvailableConfigs: IEEE8021xConfig[] = [
    {
      profileName: '8021x-config-1',
      authenticationProtocol: 0, // EAP-TLS
      pxeTimeout: 120,
      wiredInterface: true,
      version: ''
    },
    {
      profileName: '8021x-config-2',
      authenticationProtocol: 0, // EAP-TLS
      pxeTimeout: 120,
      wiredInterface: false,
      version: ''
    },
    {
      profileName: '8021x-config-3',
      authenticationProtocol: 0, // EAP-TLS
      pxeTimeout: 120,
      wiredInterface: false,
      version: ''
    }
  ]
  let ieee8021xGetDataSpy: MockInstance
  let wirelessGetDataSpy: MockInstance
  let proxyGetDataSpy: MockInstance
  let serverFeaturesGetFeaturesSpy: MockInstance
  // let tlsConfigSpy: MockInstance
  let translate: TranslateService

  const mockProxyConfigs = [
    { name: 'proxy1', address: 'http://proxy1.com', port: 8080, infoFormat: 1, networkDnsSuffix: '' },
    { name: 'proxy2', address: 'http://proxy2.com', port: 3128, infoFormat: 1, networkDnsSuffix: '' }
  ]

  beforeEach(() => {
    const profilesService = createSpyObj('ProfilesService', [
      'getRecord',
      'update',
      'create'
    ])
    const configsService = createSpyObj('ConfigsService', ['getData'])
    const ieee8021xService = createSpyObj('IEEE8021xService', ['getData'])
    const wirelessService = createSpyObj('WirelessService', ['getData'])
    const proxyConfigsService = createSpyObj('ProxyConfigsService', ['getData'])
    const serverFeaturesService = createSpyObj('ServerFeaturesService', ['getFeatures'])
    // const tlsService = createSpyObj('TLSService', ['getData'])
    const profileResponse = {
      profileName: 'profile1',
      amtPassword: 'P@ssw0rd',
      generateRandomPassword: false,
      activation: 'ccmactivate',
      ciraConfigName: 'config1',
      tlsMode: null,
      tlsSigningAuthority: null,
      dhcpEnabled: true,
      generateRandomMEBxPassword: true,
      tags: ['acm'],
      ieee8021xProfileName: ieee8021xAvailableConfigs[0].profileName,
      wifiConfigs: [{ priority: 1, profileName: 'wifi' }],
      proxyConfigs: [{ priority: 1, name: 'proxy1' }]
    }
    profileSpy = profilesService.getRecord.mockReturnValue(of(profileResponse))
    profileCreateSpy = profilesService.create.mockReturnValue(of({}))
    profileUpdateSpy = profilesService.update.mockReturnValue(of({}))
    ciraGetDataSpy = configsService.getData.mockReturnValue(of({ data: [{ profileName: '' }], totalCount: 0 }))
    ieee8021xGetDataSpy = ieee8021xService.getData.mockReturnValue(
      of({ data: ieee8021xAvailableConfigs, totalCount: ieee8021xAvailableConfigs.length })
    )
    wirelessGetDataSpy = wirelessService.getData.mockReturnValue(of({ data: [], totalCount: 0 }))
    proxyGetDataSpy = proxyConfigsService.getData.mockReturnValue(
      of({ data: mockProxyConfigs, totalCount: mockProxyConfigs.length })
    )
    serverFeaturesGetFeaturesSpy = serverFeaturesService.getFeatures.mockReturnValue(of({ ciraEnabled: true }))
    // tlsConfigSpy = tlsService.getData.mockReturnValue(of({ data: [], totalCount: 0 }))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ProfileDetailComponent
      ],
      providers: [
        provideTranslateService({
          loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' })
        }),
        { provide: ProfilesService, useValue: profilesService },
        { provide: ConfigsService, useValue: configsService },
        { provide: IEEE8021xService, useValue: ieee8021xService },
        { provide: WirelessService, useFactory: () => wirelessService },
        { provide: ProxyConfigsService, useValue: proxyConfigsService },
        { provide: ServerFeaturesService, useValue: serverFeaturesService },
        // { provide: TLSService, useValue: tlsService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ name: 'profile' })
          }
        },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  afterEach(() => {
    environment.cloud = defaultCloudMode
    TestBed.resetTestingModule()
  })

  // Re-load the edit profile through the real capture path (getRecord -> getAmtProfile) so tests
  // exercise how originals are derived rather than poking private fields directly.
  const loadProfileForEdit = (overrides: Partial<Profile>): void => {
    profileSpy.mockReturnValue(
      of({
        profileName: 'profile',
        activation: 'acmactivate',
        generateRandomPassword: true,
        generateRandomMEBxPassword: true,
        ...overrides
      } as any)
    )
    component.getAmtProfile('profile')
  }

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(ciraGetDataSpy).toHaveBeenCalled()
    expect(profileSpy).toHaveBeenCalledWith('profile')
    expect(ieee8021xGetDataSpy).toHaveBeenCalled()
    expect(wirelessGetDataSpy).toHaveBeenCalled()
    expect(proxyGetDataSpy).toHaveBeenCalled()
  })

  it('should set connectionMode to TLS when tlsMode is a TLS mode (1-4)', () => {
    const profile: Profile = { tlsMode: 4, ciraConfigName: 'config1' } as any
    component.setConnectionMode(profile)
    expect(component.profileForm.controls.connectionMode.value).toBe('TLS')
  })
  it('should set connectionMode to CIRA when ciraConfigName is set and tlsMode is not a TLS mode', () => {
    const profile: Profile = { ciraConfigName: 'config1' } as any
    component.setConnectionMode(profile)
    expect(component.profileForm.controls.connectionMode.value).toBe('CIRA')
  })
  it('should not set connectionMode to CIRA when CIRA is disabled and availability is resolved', () => {
    component.profileForm.controls.ciraConfigName.setValue('config1')
    component.ciraEnabled.set(false)
    component.ciraAvailabilityResolved.set(true)

    const profile: Profile = { ciraConfigName: 'config1' } as any
    component.setConnectionMode(profile)

    expect(component.profileForm.controls.connectionMode.value).toBe('TLS')
    expect(component.profileForm.controls.ciraConfigName.value).toBeNull()
  })
  it('should keep CIRA connectionMode before enterprise feature availability resolves', () => {
    component.ciraEnabled.set(false)
    component.ciraAvailabilityResolved.set(false)

    const profile: Profile = { ciraConfigName: 'config1' } as any
    component.setConnectionMode(profile)

    expect(component.profileForm.controls.connectionMode.value).toBe('CIRA')
  })
  it('should set connectionMode to DIRECT when tlsMode is 0 and no CIRA config', () => {
    const profile: Profile = { tlsMode: 0, ciraConfigName: null } as any
    component.setConnectionMode(profile)
    expect(component.profileForm.controls.connectionMode.value).toBe('DIRECT')
  })
  it('should set connectionMode to DIRECT when tlsMode is null and no CIRA config', () => {
    const profile: Profile = { tlsMode: null, ciraConfigName: null } as any
    component.setConnectionMode(profile)
    expect(component.profileForm.controls.connectionMode.value).toBe('DIRECT')
  })
  it('should cancel', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/profiles'])
  })
  it(`should not enable mebxPassword when generateRandomMEBxPassword is false and activation is ccmactivate`, () => {
    component.profileForm.patchValue({
      activation: 'ccmactivate',
      generateRandomMEBxPassword: false
    })
    expect(component.profileForm.controls.mebxPassword.disabled).toBe(true)
    component.generateRandomMEBxPasswordChange(false)
    expect(component.profileForm.controls.mebxPassword.disabled).toBe(true)
  })
  it('should disable mebxPassword when generateRandomMEBxPassword is true', () => {
    component.profileForm.patchValue({
      activation: 'acmactivate',
      generateRandomMEBxPassword: false
    })
    expect(component.profileForm.controls.mebxPassword.disabled).toBe(false)
    component.generateRandomMEBxPasswordChange(true)
    expect(component.profileForm.controls.mebxPassword.disabled).toBe(true)
  })
  it('should enable amtPassword when generateRandomPassword is false', () => {
    component.profileForm.patchValue({ generateRandomPassword: true })
    expect(component.profileForm.controls.amtPassword.disabled).toBe(true)
    component.generateRandomPasswordChange(false)
    expect(component.profileForm.controls.amtPassword.disabled).toBe(false)
  })
  it('should disable amtPassword when generateRandomPassword is true', () => {
    component.profileForm.patchValue({ generateRandomPassword: false })
    expect(component.profileForm.controls.amtPassword.disabled).toBe(false)
    component.profileForm.patchValue({ generateRandomPassword: true })
    expect(component.profileForm.controls.amtPassword.disabled).toBe(true)
  })

  it('should submit when valid (update)', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)

    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      ieee8021xProfileName: ieee8021xAvailableConfigs[0].profileName,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(profileUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should not require the AMT password on edit when a static password is already stored', () => {
    // Default mock profile has generateRandomPassword: false, so a static secret is stored server-side.
    component.generateRandomPasswordChange(false)
    expect(component.profileForm.controls.amtPassword.hasValidator(Validators.required)).toBe(false)
  })

  it('should omit empty passwords from the update payload', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)

    // Both secrets already stored statically server-side, so blank fields preserve them.
    loadProfileForEdit({ activation: 'acmactivate', generateRandomPassword: false, generateRandomMEBxPassword: false })
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      amtPassword: '',
      mebxPassword: '',
      dhcpEnabled: true,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(routerSpy).toHaveBeenCalled()
    expect(profileUpdateSpy).toHaveBeenCalled()
    const payload = profileUpdateSpy.mock.lastCall![0]
    expect(payload.amtPassword).toBeUndefined()
    expect(payload.mebxPassword).toBeUndefined()
  })

  it('should require passwords on create', () => {
    component.isEdit.set(false)
    component.profileForm.patchValue({
      activation: 'acmactivate',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false
    })

    expect(component.profileForm.controls.amtPassword.hasValidator(Validators.required)).toBe(true)
    expect(component.profileForm.controls.mebxPassword.hasValidator(Validators.required)).toBe(true)
  })
  it('should submit when valid (create)', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should submit when valid with random passwords (create)', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: '',
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: true,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should cancel submit with random passwords', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: '',
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: true,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should enable the cira config and disable wifi config when static network is selected', () => {
    component.dhcpEnabledChange(false)
    expect(component.profileForm.controls.ciraConfigName.enabled).toBe(true)
    // Add check for wifi config disabled or selected wifi config is 0
  })

  it('should enable the localWifiSync checkbox', () => {
    component.localWifiSyncChange(true)
    expect(component.profileForm.controls.localWifiSyncEnabled.enabled).toBe(false)
  })

  it('should disable the localWifiSync checkbox', () => {
    component.localWifiSyncChange(false)
    expect(component.profileForm.controls.localWifiSyncEnabled.enabled).toBe(true)
  })

  it('should enable the uefiWifiSync checkbox', () => {
    component.uefiWifiSyncChange(true)
    expect(component.profileForm.controls.uefiWifiSyncEnabled.enabled).toBe(false)
  })

  it('should disable the uefiWifiSync checkbox', () => {
    component.uefiWifiSyncChange(false)
    expect(component.profileForm.controls.uefiWifiSyncEnabled.enabled).toBe(true)
  })

  it('should submit if cira config and static network are simultaneously selected and user confirms', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      userConsent: 'All',
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should cancel submit if cira config and static network are simultaneously selected and user cancels', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: false,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should submit if cira config and static network are simultaneously selected + randomly generated password and user confirms', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: '',
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should cancel submit if cira config and static network are simultaneously selected + randomly generated password and user cancels dialog', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: '',
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should submit when valid with only random mebx password + acm activation', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: true,
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      connectionMode: 'DIRECT',
      userConsent: 'None',
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true,
      ciraConfigName: null
    })
    component.confirm()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should submit if cira config and static network are simultaneously selected + only random mebx password + ccm activation', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'ccmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should cancel submit if cira config and static network are simultaneously selected + only random mebx password + ccm activation', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.isEdit.set(false)
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'ccmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should update the selected wifi configs on selecting a wifi profile', () => {
    component.selectedWifiConfigs.set([{ priority: 1, profileName: 'home' }])
    const option: MatAutocompleteSelectedEvent = {
      option: {
        value: 'work'
      }
    } as any
    component.selectWifiProfile(option)
    expect(component.selectedWifiConfigs().length).toBe(2)
  })

  it('should update the selected wifi configs when a selected config is removed', () => {
    const wifiCfg01 = { priority: 1, profileName: 'home' }
    const wifiCfg02 = { priority: 2, profileName: 'work' }
    component.selectedWifiConfigs.set([wifiCfg01, wifiCfg02])
    component.removeWifiProfile(wifiCfg02)
    expect(component.selectedWifiConfigs().length).toBe(1)
  })

  it('should adjust related fields on selecting activation mode', () => {
    environment.cloud = true
    component.activationChange('ccmactivate')
    expect(component.profileForm.controls.generateRandomMEBxPassword.disabled).toBe(true)
    expect(component.profileForm.controls.userConsent.disabled).toBe(true)
    expect(component.profileForm.controls.userConsent.value).toEqual('All')
    component.activationChange('acmactivate')
    expect(component.profileForm.controls.generateRandomMEBxPassword.disabled).toBe(false)
    expect(component.profileForm.controls.userConsent.disabled).toBe(false)
  })

  it('should return the search results when a search string is entered', () => {
    component.wirelessConfigurations.set(['homeWiFi', 'officeWiFi'])
    const searchString = 'home'
    const results = component.search(searchString)
    expect(results).toEqual(['homeWiFi'])
  })

  it('should update the list of tags when a tag is added ', () => {
    component.tags.set([
      'acm',
      'ccm',
      'profile'
    ])
    const e = {
      value: '',
      chipInput: {
        clear: vi.fn()
      }
    }
    e.value = '  ccm '
    component.add(e as unknown as MatChipInputEvent)
    expect(component.tags()).toEqual([
      'acm',
      'ccm',
      'profile'
    ])
    e.value = 'newtag'
    component.add(e as unknown as MatChipInputEvent)
    expect(component.tags()).toEqual([
      'acm',
      'ccm',
      'newtag',
      'profile'
    ])
  })

  it('should update the list of tags when a tag is removed ', () => {
    component.tags.set([
      'acm',
      'ccm',
      'profile'
    ])
    const tagName = 'ccm'
    component.remove(tagName)
    expect(component.tags()).toEqual(['acm', 'profile'])
  })

  it('should turn amt visibility on when it is off', () => {
    component.amtInputType.set('password')
    component.toggleAMTPassVisibility()
    expect(component.amtInputType()).toEqual('text')
  })

  it('should turn amt visibility off when it is on', () => {
    component.amtInputType.set('text')
    component.toggleAMTPassVisibility()
    expect(component.amtInputType()).toEqual('password')
  })

  it('should turn mebx visibility on when it is off', () => {
    component.mebxInputType.set('password')
    component.toggleMEBXPassVisibility()
    expect(component.mebxInputType()).toEqual('text')
  })

  it('should turn mebx visibility off when it is on', () => {
    component.mebxInputType.set('text')
    component.toggleMEBXPassVisibility()
    expect(component.mebxInputType()).toEqual('password')
  })

  it('should generate a random password without a specified length', () => {
    const password = component.generateRandomPassword()
    expect(password).toBeDefined()
    expect(password.length).toBe(16)
  })

  it('should generate a random password with specified length', () => {
    const password = component.generateRandomPassword(10)
    expect(password).toBeDefined()
    expect(password.length).toBe(10)
  })

  it('should change the value of amt password to a random strong password', () => {
    component.profileForm.controls.amtPassword.setValue('')
    component.generateAMTPassword()
    expect(component.profileForm.controls.amtPassword.value!.length).toBe(16)
  })

  it('should change the value of mebx password to a random strong password', () => {
    component.profileForm.controls.mebxPassword.setValue('1@qW')
    component.generateMEBXPassword()
    expect(component.profileForm.controls.mebxPassword.value!.length).toBe(16)
  })

  it('should set the ciraCofigName property to null when TLS Selected', () => {
    component.connectionModeChange('TLS')
    expect(component.profileForm.controls.ciraConfigName.value).toEqual(null)
    expect(component.profileForm.controls.ciraConfigName.valid).toBe(true)
    expect(component.profileForm.controls.tlsMode.valid).toBe(false)
    expect(component.profileForm.controls.tlsSigningAuthority.value).toEqual(component.tlsDefaultSigningAuthority)
    expect(component.profileForm.controls.tlsSigningAuthority.valid).toBe(true)
  })
  it('should clear a non-TLS tlsMode of 0 when TLS is selected', () => {
    component.profileForm.controls.tlsMode.setValue(0)
    component.connectionModeChange('TLS')
    expect(component.profileForm.controls.tlsMode.value).toEqual(null)
    expect(component.profileForm.controls.tlsMode.valid).toBe(false)
  })
  it('should keep an already selected tlsMode when TLS is selected', () => {
    component.profileForm.controls.tlsMode.setValue(2)
    component.connectionModeChange('TLS')
    expect(component.profileForm.controls.tlsMode.value).toEqual(2)
    expect(component.profileForm.controls.tlsMode.valid).toBe(true)
  })
  it('should set the tlsMode property to null when CIRA Selected', () => {
    component.connectionModeChange('CIRA')
    expect(component.profileForm.controls.tlsMode.value).toEqual(null)
    expect(component.profileForm.controls.tlsMode.valid).toBe(true)
    expect(component.profileForm.controls.ciraConfigName.value).toBe('config1')
  })
  it('should return update error', () => {
    profileUpdateSpy.mockReturnValue(throwError(() => new Error('nope')))
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)

    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      ieee8021xProfileName: ieee8021xAvailableConfigs[0].profileName,
      ciraConfigName: 'config1'
    })
    component.confirm()

    expect(profileUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  // Password preservation on edit: a blank field is allowed only when a static
  // secret already exists server-side; switching random -> static requires one.
  describe('Password preservation on edit', () => {
    it('should capture the original password settings when loading a profile to edit', () => {
      const profileData = {
        profileName: 'acm-static',
        activation: 'acmactivate',
        generateRandomPassword: true,
        generateRandomMEBxPassword: false
      } as any
      profileSpy.mockReturnValue(of(profileData))

      component.getAmtProfile('acm-static')

      expect(component['originalGenerateRandomPassword']).toBe(true)
      expect(component['originalGenerateRandomMEBxPassword']).toBe(false)
      expect(component['originalActivation']).toBe('acmactivate')
    })

    it('should require the AMT password when switching from random to static on edit', () => {
      loadProfileForEdit({ generateRandomPassword: true })
      component.generateRandomPasswordChange(false)
      expect(component.profileForm.controls.amtPassword.hasValidator(Validators.required)).toBe(true)
    })

    it('should require the MEBx password when switching from random to static (acm) on edit', () => {
      // Default mock profile has generateRandomMEBxPassword: true (no stored MEBx secret).
      component.profileForm.controls.activation.setValue('acmactivate')
      component.generateRandomMEBxPasswordChange(false)
      expect(component.profileForm.controls.mebxPassword.hasValidator(Validators.required)).toBe(true)
    })

    it('should not require the MEBx password on edit when a static acm secret is already stored', () => {
      loadProfileForEdit({ activation: 'acmactivate', generateRandomMEBxPassword: false })
      component.profileForm.controls.activation.setValue('acmactivate')
      component.generateRandomMEBxPasswordChange(false)
      expect(component.profileForm.controls.mebxPassword.hasValidator(Validators.required)).toBe(false)
    })

    it('should require the MEBx password when an existing ccm profile switches to acm', () => {
      // Static MEBx secrets are only stored for acm, so a ccm origin has none to preserve.
      loadProfileForEdit({ activation: 'ccmactivate', generateRandomMEBxPassword: false })
      component.profileForm.controls.activation.setValue('acmactivate')
      component.generateRandomMEBxPasswordChange(false)
      expect(component.profileForm.controls.mebxPassword.hasValidator(Validators.required)).toBe(true)
    })

    it('should recompute MEBx validity immediately when switching activation from ccm to acm', () => {
      // ccm origin has no stored MEBx secret, so acm + empty MEBx must be invalid right away (no stale valid state).
      loadProfileForEdit({ activation: 'ccmactivate', generateRandomMEBxPassword: false })
      component.profileForm.controls.mebxPassword.setValue('')
      component.profileForm.controls.generateRandomMEBxPassword.setValue(false)

      component.activationChange('acmactivate')

      expect(component.profileForm.controls.mebxPassword.hasValidator(Validators.required)).toBe(true)
      expect(component.profileForm.controls.mebxPassword.valid).toBe(false)
    })

    it('should block submit when switching to a static AMT password but leaving the field blank', () => {
      const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)

      loadProfileForEdit({ generateRandomPassword: true })
      component.profileForm.patchValue({
        profileName: 'profile',
        activation: 'acmactivate',
        generateRandomPassword: false,
        amtPassword: '',
        generateRandomMEBxPassword: false,
        mebxPassword: 'Password123',
        dhcpEnabled: true,
        ciraConfigName: 'config1'
      })
      component.confirm()

      expect(component.profileForm.controls.amtPassword.hasValidator(Validators.required)).toBe(true)
      expect(profileUpdateSpy).not.toHaveBeenCalled()
      expect(routerSpy).not.toHaveBeenCalled()
    })

    it('should surface the server error when the API rejects an omitted password', () => {
      // The UI allows omitting both passwords (static secrets stored server-side), but if the API
      // contract drifts and rejects the PATCH, the user must see why rather than a silent no-op.
      const serverError = ['MEBx password is required for acmactivate']
      profileUpdateSpy.mockReturnValue(throwError(() => serverError))
      loadProfileForEdit({
        activation: 'acmactivate',
        generateRandomPassword: false,
        generateRandomMEBxPassword: false
      })
      component.profileForm.patchValue({
        profileName: 'profile',
        activation: 'acmactivate',
        generateRandomPassword: false,
        generateRandomMEBxPassword: false,
        amtPassword: '',
        mebxPassword: '',
        dhcpEnabled: true,
        ciraConfigName: 'config1'
      })
      component.confirm()

      expect(profileUpdateSpy).toHaveBeenCalled()
      expect(component.errorMessages()).toEqual(serverError)
    })
  })

  // CIRA gating in enterprise mode (driven by the Console server's APP_DISABLE_CIRA setting).
  describe('CIRA gating (enterprise mode)', () => {
    const originalCloud = environment.cloud

    // Re-create the component in enterprise mode so initializeData() takes the
    // server-features branch instead of the cloud branch.
    const createEnterpriseComponent = (): ProfileDetailComponent => {
      environment.cloud = false
      fixture.destroy()
      fixture = TestBed.createComponent(ProfileDetailComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
      return component
    }

    afterEach(() => {
      environment.cloud = originalCloud
    })

    it('should not fetch CIRA configs when the server reports CIRA disabled', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(of({ ciraEnabled: false }))
      ciraGetDataSpy.mockClear()

      const enterpriseComponent = createEnterpriseComponent()

      expect(serverFeaturesGetFeaturesSpy).toHaveBeenCalled()
      expect(ciraGetDataSpy).not.toHaveBeenCalled()
      expect(enterpriseComponent.ciraEnabled()).toBe(false)
      expect(fixture.nativeElement.querySelector('[data-cy="radio-cira"]')).toBeNull()
    })

    it('should expose ciraEnabled() === false after the features call resolves with CIRA disabled', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(of({ ciraEnabled: false }))

      const enterpriseComponent = createEnterpriseComponent()

      expect(enterpriseComponent.ciraEnabled()).toBe(false)
    })

    it('should fetch CIRA configs when the server reports CIRA enabled', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(of({ ciraEnabled: true }))
      ciraGetDataSpy.mockClear()

      const enterpriseComponent = createEnterpriseComponent()

      expect(ciraGetDataSpy).toHaveBeenCalled()
      expect(enterpriseComponent.ciraEnabled()).toBe(true)
      expect(fixture.nativeElement.querySelector('[data-cy="radio-cira"]')).not.toBeNull()
    })

    it('should fail open and fetch CIRA configs when the features call errors', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(throwError(() => new Error('nope')))
      ciraGetDataSpy.mockClear()

      const enterpriseComponent = createEnterpriseComponent()

      expect(ciraGetDataSpy).toHaveBeenCalled()
      expect(enterpriseComponent.ciraEnabled()).toBe(true)
      expect(fixture.nativeElement.querySelector('[data-cy="radio-cira"]')).not.toBeNull()
    })

    // Mike's review feedback on #3445: hiding the section while /server/features is still in
    // flight leaves a saved CIRA profile with no visible selection at all, which reads as a bug
    // on a server where CIRA is actually enabled.
    it('should keep the CIRA option visible but disabled while the features call is in flight', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(NEVER)

      const enterpriseComponent = createEnterpriseComponent()
      loadProfileForEdit({ ciraConfigName: 'config1' })
      fixture.detectChanges()

      const radio = fixture.nativeElement.querySelector('[data-cy="radio-cira"]')
      expect(enterpriseComponent.ciraAvailabilityResolved()).toBe(false)
      expect(radio).not.toBeNull()
      expect(radio.classList).toContain('mat-mdc-radio-disabled')
      // The saved CIRA selection stays visible rather than rendering an empty radio group.
      expect(enterpriseComponent.profileForm.controls.connectionMode.value).toBe('CIRA')
    })

    it('should warn before saving an edited profile whose stored CIRA config is about to be dropped', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(of({ ciraEnabled: false }))
      const enterpriseComponent = createEnterpriseComponent()

      // Stored profile still references CIRA, so setConnectionMode() coerces the form to TLS.
      loadProfileForEdit({ generateRandomPassword: true, generateRandomMEBxPassword: true, ciraConfigName: 'config1' })
      expect(enterpriseComponent.profileForm.controls.connectionMode.value).toBe('TLS')

      vi.spyOn(enterpriseComponent.router, 'navigate').mockImplementation((() => undefined) as any)
      const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({
        afterClosed: () => of(true)
      } as any)
      enterpriseComponent.profileForm.patchValue({ profileName: 'profile', dhcpEnabled: true, tlsMode: 1 })
      enterpriseComponent.confirm()

      expect(dialogSpy).toHaveBeenCalledWith(NoCIRAWarningComponent, expect.anything())
      expect(profileUpdateSpy).toHaveBeenCalled()
    })

    // A Console that answers 200 without the flag must not read as "CIRA disabled", or the
    // save flow would offer to drop a stored CIRA config on a server where CIRA still works.
    it('should fail open when the features response omits ciraEnabled', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(of({} as any))
      ciraGetDataSpy.mockClear()

      const enterpriseComponent = createEnterpriseComponent()

      expect(ciraGetDataSpy).toHaveBeenCalled()
      expect(enterpriseComponent.ciraEnabled()).toBe(true)
      expect(fixture.nativeElement.querySelector('[data-cy="radio-cira"]')).not.toBeNull()
    })

    it('should not warn about a dropped CIRA config while the features call is in flight', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(NEVER)
      const enterpriseComponent = createEnterpriseComponent()

      loadProfileForEdit({ generateRandomPassword: true, generateRandomMEBxPassword: true, ciraConfigName: 'config1' })
      expect(enterpriseComponent.ciraAvailabilityResolved()).toBe(false)

      vi.spyOn(enterpriseComponent.router, 'navigate').mockImplementation((() => undefined) as any)
      const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockImplementation((() => undefined) as any)
      // User switches the profile to TLS themselves before the server answers.
      enterpriseComponent.profileForm.patchValue({
        profileName: 'profile',
        dhcpEnabled: true,
        connectionMode: 'TLS',
        tlsMode: 1
      })
      enterpriseComponent.confirm()

      expect(dialogSpy).not.toHaveBeenCalled()
      expect(profileUpdateSpy).toHaveBeenCalled()
    })

    it('should not warn when saving a non-CIRA profile that never had a CIRA config', () => {
      serverFeaturesGetFeaturesSpy.mockReturnValue(of({ ciraEnabled: false }))
      const enterpriseComponent = createEnterpriseComponent()

      loadProfileForEdit({ generateRandomPassword: true, generateRandomMEBxPassword: true })

      vi.spyOn(enterpriseComponent.router, 'navigate').mockImplementation((() => undefined) as any)
      const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockImplementation((() => undefined) as any)
      enterpriseComponent.profileForm.patchValue({
        profileName: 'profile',
        dhcpEnabled: true,
        connectionMode: 'TLS',
        tlsMode: 1
      })
      enterpriseComponent.confirm()

      expect(dialogSpy).not.toHaveBeenCalled()
      expect(profileUpdateSpy).toHaveBeenCalled()
    })
  })

  // Proxy Configuration Tests
  describe('Proxy Configuration Tests', () => {
    it('should load proxy configurations on initialization', () => {
      expect(proxyGetDataSpy).toHaveBeenCalled()
      expect(component.ProxyConfigurations().length).toBe(2)
      expect(component.ProxyConfigurations()).toEqual(['proxy1', 'proxy2'])
    })

    it('should show proxy configurations when available', () => {
      component.ProxyConfigurations.set(['proxy1', 'proxy2'])
      expect(component.showProxyConfigurations()).toBe(true)
    })

    it('should not show proxy configurations when none available', () => {
      component.ProxyConfigurations.set([])
      expect(component.showProxyConfigurations()).toBe(false)
    })

    it('should select proxy profile and assign priority', () => {
      const event = {
        option: { value: 'proxy1' }
      } as MatAutocompleteSelectedEvent

      component.selectedProxyConfigs.set([])
      component.selectProxyProfile(event)

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs.length).toBe(1)
      expect(selectedConfigs[0]).toEqual({
        priority: 1,
        name: 'proxy1'
      })
    })

    it('should not add duplicate proxy profile', () => {
      const event = {
        option: { value: 'proxy1' }
      } as MatAutocompleteSelectedEvent

      component.selectedProxyConfigs.set([
        { priority: 1, name: 'proxy1' }
      ])

      component.selectProxyProfile(event)
      expect(component.selectedProxyConfigs().length).toBe(1)
    })

    it('should not select NO_PROXY_CONFIGS option', () => {
      const event = {
        option: { value: 'profileDetail.noProxy.value' }
      } as MatAutocompleteSelectedEvent

      component.selectedProxyConfigs.set([])
      component.selectProxyProfile(event)
      expect(component.selectedProxyConfigs().length).toBe(0)
    })

    it('should assign correct priority when adding multiple proxies', () => {
      const event1 = { option: { value: 'proxy1' } } as MatAutocompleteSelectedEvent
      const event2 = { option: { value: 'proxy2' } } as MatAutocompleteSelectedEvent

      component.selectedProxyConfigs.set([])
      component.selectProxyProfile(event1)
      component.selectProxyProfile(event2)

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs.length).toBe(2)
      expect(selectedConfigs[0].priority).toBe(1)
      expect(selectedConfigs[1].priority).toBe(2)
    })

    it('should remove proxy profile and update priorities', () => {
      const proxyToRemove = { priority: 1, name: 'proxy1' }
      component.selectedProxyConfigs.set([
        proxyToRemove,
        { priority: 2, name: 'proxy2' }
      ])

      component.removeProxyProfile(proxyToRemove)

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs.length).toBe(1)
      expect(selectedConfigs[0].priority).toBe(1)
      expect(selectedConfigs[0].name).toBe('proxy2')
    })

    it('should handle drag and drop reordering', () => {
      component.selectedProxyConfigs.set([
        { priority: 1, name: 'proxy1' },
        { priority: 2, name: 'proxy2' }
      ])

      const dropEvent = {
        previousIndex: 0,
        currentIndex: 1
      } as any

      component.dropProxy(dropEvent)

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs[0].name).toBe('proxy2')
      expect(selectedConfigs[0].priority).toBe(1)
      expect(selectedConfigs[1].name).toBe('proxy1')
      expect(selectedConfigs[1].priority).toBe(2)
    })

    it('should update priorities for proxy configs', () => {
      const configs = [
        { priority: 3, name: 'proxy1' },
        { priority: 1, name: 'proxy2' }
      ]

      const result = component['updatePrioritiesForProxyConfigs'](configs)

      expect(result[0].priority).toBe(1)
      expect(result[0].name).toBe('proxy1')
      expect(result[1].priority).toBe(2)
      expect(result[1].name).toBe('proxy2')
    })

    it('should update proxy priorities', () => {
      component.selectedProxyConfigs.set([
        { priority: 3, name: 'proxy1' },
        { priority: 1, name: 'proxy2' }
      ])

      component.updateProxyPriorities()

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs[0].priority).toBe(1)
      expect(selectedConfigs[1].priority).toBe(2)
    })

    it('should filter proxy configurations for autocomplete', () => {
      component.ProxyConfigurations.set([
        'proxy1',
        'proxy2',
        'test-proxy'
      ])

      const result = component.searchProxy('proxy')
      expect(result).toContain('proxy1')
      expect(result).toContain('proxy2')
      expect(result).toContain('test-proxy') // All contain 'proxy' substring
    })

    it('should return NO_PROXY_CONFIGS when no matches found', () => {
      component.ProxyConfigurations.set(['proxy1', 'proxy2'])

      const result = component.searchProxy('nonexistent')
      expect(result).toEqual(['profileDetail.noProxy.value'])
    })

    it('should return correct CSS classes for proxy selectability', () => {
      const result1 = component.isProxySelectable('proxy1')
      expect(result1['no-results']).toBeFalsy()

      const result2 = component.isProxySelectable('profileDetail.noProxy.value')
      expect(result2['no-results']).toBe(true)
    })

    it('should include proxy configs in form submission', () => {
      const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)

      component.isEdit.set(false)
      component.selectedProxyConfigs.set([
        { priority: 1, name: 'proxy1' },
        { priority: 2, name: 'proxy2' }
      ])

      component.profileForm.patchValue({
        profileName: 'profile',
        activation: 'acmactivate',
        amtPassword: 'Password123',
        generateRandomPassword: false,
        generateRandomMEBxPassword: false,
        mebxPassword: 'Password123',
        dhcpEnabled: true,
        ciraConfigName: 'config1'
      })

      component.confirm()

      expect(profileCreateSpy).toHaveBeenCalled()
      expect(routerSpy).toHaveBeenCalled()
      expect(profileCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          proxyConfigs: [
            { priority: 1, name: 'proxy1' },
            { priority: 2, name: 'proxy2' }
          ]
        })
      )
    })

    it('should load existing proxy configs with proper priorities when editing', () => {
      const profileData = {
        profileName: 'test-profile',
        proxyConfigs: [
          { profileName: 'proxy1' }, // Missing priority
          { priority: 2, profileName: 'proxy2' }
        ]
      } as any

      profileSpy.mockReturnValue(of(profileData))

      component.getAmtProfile('test-profile')

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs.length).toBe(2)
      expect(selectedConfigs[0].priority).toBe(1) // Should assign priority 1
      expect(selectedConfigs[1].priority).toBe(2) // Should keep existing priority
    })

    it('should handle error when loading proxy configs', () => {
      proxyGetDataSpy.mockReturnValue(throwError(() => new Error('Proxy load error')))

      component['getProxyConfigs']()

      expect(component.errorMessages().length).toBeGreaterThan(0)
    })

    it('should clear proxy autocomplete after selection', () => {
      const event = {
        option: { value: 'proxy1' }
      } as MatAutocompleteSelectedEvent

      component.selectedProxyConfigs.set([])
      const patchValueSpy = vi.spyOn(component.proxyAutocomplete, 'patchValue').mockImplementation(() => undefined)

      component.selectProxyProfile(event)

      expect(patchValueSpy).toHaveBeenCalledWith('')
    })
  })
})
