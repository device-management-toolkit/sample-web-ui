/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of, throwError } from 'rxjs'
import { ConfigsService } from 'src/app/configs/configs.service'
import { WirelessService } from 'src/app/wireless/wireless.service'
import { ProfilesService } from '../profiles.service'
import { IEEE8021xService } from 'src/app/ieee8021x/ieee8021x.service'
import { ProxyConfigsService } from 'src/app/proxy-configs/proxy-configs.service'
import { ProfileDetailComponent } from './profile-detail.component'
import { Profile } from '../profiles.constants'
import { MatChipInputEvent } from '@angular/material/chips'
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { IEEE8021xConfig } from 'src/models/models'
import { environment } from 'src/environments/environment'
import { provideTranslateService, TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideTranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('ProfileDetailComponent', () => {
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>
  let profileSpy: jasmine.Spy
  let ciraGetDataSpy: jasmine.Spy
  let profileCreateSpy: jasmine.Spy
  let profileUpdateSpy: jasmine.Spy
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
  let ieee8021xGetDataSpy: jasmine.Spy
  let wirelessGetDataSpy: jasmine.Spy
  let proxyGetDataSpy: jasmine.Spy
  // let tlsConfigSpy: jasmine.Spy
  let translate: TranslateService

  const mockProxyConfigs = [
    { name: 'proxy1', address: 'http://proxy1.com', port: 8080, infoFormat: 1, networkDnsSuffix: '' },
    { name: 'proxy2', address: 'http://proxy2.com', port: 3128, infoFormat: 1, networkDnsSuffix: '' }
  ]

  beforeEach(() => {
    const profilesService = jasmine.createSpyObj('ProfilesService', [
      'getRecord',
      'update',
      'create'
    ])
    const configsService = jasmine.createSpyObj('ConfigsService', ['getData'])
    const ieee8021xService = jasmine.createSpyObj('IEEE8021xService', ['getData'])
    const wirelessService = jasmine.createSpyObj('WirelessService', ['getData'])
    const proxyConfigsService = jasmine.createSpyObj('ProxyConfigsService', ['getData'])
    // const tlsService = jasmine.createSpyObj('TLSService', ['getData'])
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
    profileSpy = profilesService.getRecord.and.returnValue(of(profileResponse))
    profileCreateSpy = profilesService.create.and.returnValue(of({}))
    profileUpdateSpy = profilesService.update.and.returnValue(of({}))
    ciraGetDataSpy = configsService.getData.and.returnValue(of({ data: [{ profileName: '' }], totalCount: 0 }))
    ieee8021xGetDataSpy = ieee8021xService.getData.and.returnValue(
      of({ data: ieee8021xAvailableConfigs, totalCount: ieee8021xAvailableConfigs.length })
    )
    wirelessGetDataSpy = wirelessService.getData.and.returnValue(of({ data: [], totalCount: 0 }))
    proxyGetDataSpy = proxyConfigsService.getData.and.returnValue(
      of({ data: mockProxyConfigs, totalCount: mockProxyConfigs.length })
    )
    // tlsConfigSpy = tlsService.getData.and.returnValue(of({ data: [], totalCount: 0 }))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ProfileDetailComponent,
        TranslateModule.forRoot()
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
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(ciraGetDataSpy).toHaveBeenCalled()
    expect(profileSpy).toHaveBeenCalledWith('profile')
    expect(ieee8021xGetDataSpy).toHaveBeenCalled()
    expect(wirelessGetDataSpy).toHaveBeenCalled()
    expect(proxyGetDataSpy).toHaveBeenCalled()
  })
  it('should set connectionMode to TLS when tlsMode is not null', () => {
    const profile: Profile = { tlsMode: 4, ciraConfigName: 'config1' } as any
    component.setConnectionMode(profile)
    expect(component.profileForm.controls.connectionMode.value).toBe('TLS')
  })
  it('should set connectionMode to CIRA when ciraConfigName is not null', () => {
    const profile: Profile = { ciraConfigName: 'config1' } as any
    component.setConnectionMode(profile)
    expect(component.profileForm.controls.connectionMode.value).toBe('CIRA')
  })
  it('should cancel', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/profiles'])
  })
  it(`should not enable mebxPassword when generateRandomMEBxPassword is false and activation is ccmactivate`, () => {
    component.profileForm.patchValue({
      activation: 'ccmactivate',
      generateRandomMEBxPassword: false
    })
    expect(component.profileForm.controls.mebxPassword.disabled).toBeTrue()
    component.generateRandomMEBxPasswordChange(false)
    expect(component.profileForm.controls.mebxPassword.disabled).toBeTrue()
  })
  it('should disable mebxPassword when generateRandomMEBxPassword is true', () => {
    component.profileForm.patchValue({
      activation: 'acmactivate',
      generateRandomMEBxPassword: false
    })
    expect(component.profileForm.controls.mebxPassword.disabled).toBeFalse()
    component.generateRandomMEBxPasswordChange(true)
    expect(component.profileForm.controls.mebxPassword.disabled).toBeTrue()
  })
  it('should enable amtPassword when generateRandomPassword is false', () => {
    component.profileForm.patchValue({ generateRandomPassword: true })
    expect(component.profileForm.controls.amtPassword.disabled).toBeTrue()
    component.generateRandomPasswordChange(false)
    expect(component.profileForm.controls.amtPassword.disabled).toBeFalse()
  })
  it('should disable amtPassword when generateRandomPassword is true', () => {
    component.profileForm.patchValue({ generateRandomPassword: false })
    expect(component.profileForm.controls.amtPassword.disabled).toBeFalse()
    component.profileForm.patchValue({ generateRandomPassword: true })
    expect(component.profileForm.controls.amtPassword.disabled).toBeTrue()
  })

  it('should submit when valid (update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

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
  it('should submit when valid (create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

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
        clear: jasmine.createSpy()
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
    expect(component.profileForm.controls.ciraConfigName.valid).toBeTrue()
    expect(component.profileForm.controls.tlsMode.valid).toBeFalse()
    expect(component.profileForm.controls.tlsSigningAuthority.value).toEqual(component.tlsDefaultSigningAuthority)
    expect(component.profileForm.controls.tlsSigningAuthority.valid).toBeTrue()
  })
  it('should set the tlsMode property to null when CIRA Selected', () => {
    component.connectionModeChange('CIRA')
    expect(component.profileForm.controls.tlsMode.value).toEqual(null)
    expect(component.profileForm.controls.tlsMode.valid).toBeTrue()
    expect(component.profileForm.controls.ciraConfigName.value).toBe('config1')
  })
  it('should return update error', () => {
    profileUpdateSpy.and.returnValue(throwError(() => new Error('nope')))
    const routerSpy = spyOn(component.router, 'navigate')

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
        { priority: 1, name: 'proxy1' }])

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
        { priority: 2, name: 'proxy2' }])

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
      const routerSpy = spyOn(component.router, 'navigate')

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
        jasmine.objectContaining({
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

      profileSpy.and.returnValue(of(profileData))

      component.getAmtProfile('test-profile')

      const selectedConfigs = component.selectedProxyConfigs()
      expect(selectedConfigs.length).toBe(2)
      expect(selectedConfigs[0].priority).toBe(1) // Should assign priority 1
      expect(selectedConfigs[1].priority).toBe(2) // Should keep existing priority
    })

    it('should handle error when loading proxy configs', () => {
      proxyGetDataSpy.and.returnValue(throwError(() => new Error('Proxy load error')))

      component['getProxyConfigs']()

      expect(component.errorMessages().length).toBeGreaterThan(0)
    })

    it('should clear proxy autocomplete after selection', () => {
      const event = {
        option: { value: 'proxy1' }
      } as MatAutocompleteSelectedEvent

      component.selectedProxyConfigs.set([])
      const patchValueSpy = spyOn(component.proxyAutocomplete, 'patchValue')

      component.selectProxyProfile(event)

      expect(patchValueSpy).toHaveBeenCalledWith('')
    })
  })
})
