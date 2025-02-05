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
import { ProfileDetailComponent } from './profile-detail.component'
import { Profile } from '../profiles.constants'
import { MatChipInputEvent } from '@angular/material/chips'
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { IEEE8021xConfig } from 'src/models/models'

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
  // let tlsConfigSpy: jasmine.Spy
  beforeEach(async () => {
    const profilesService = jasmine.createSpyObj('ProfilesService', [
      'getRecord',
      'update',
      'create'
    ])
    const configsService = jasmine.createSpyObj('ConfigsService', ['getData'])
    const ieee8021xService = jasmine.createSpyObj('IEEE8021xService', ['getData'])
    const wirelessService = jasmine.createSpyObj('WirelessService', ['getData'])
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
      wifiConfigs: [{ priority: 1, profileName: 'wifi' }]
    }
    profileSpy = profilesService.getRecord.and.returnValue(of(profileResponse))
    profileCreateSpy = profilesService.create.and.returnValue(of({}))
    profileUpdateSpy = profilesService.update.and.returnValue(of({}))
    ciraGetDataSpy = configsService.getData.and.returnValue(of({ data: [{ profileName: '' }], totalCount: 0 }))
    ieee8021xGetDataSpy = ieee8021xService.getData.and.returnValue(
      of({ data: ieee8021xAvailableConfigs, totalCount: ieee8021xAvailableConfigs.length })
    )
    wirelessGetDataSpy = wirelessService.getData.and.returnValue(of({ data: [], totalCount: 0 }))
    // tlsConfigSpy = tlsService.getData.and.returnValue(of({ data: [], totalCount: 0 }))
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ProfileDetailComponent
      ],
      providers: [
        { provide: ProfilesService, useValue: profilesService },
        { provide: ConfigsService, useValue: configsService },
        { provide: IEEE8021xService, useValue: ieee8021xService },
        { provide: WirelessService, useFactory: () => wirelessService },
        // { provide: TLSService, useValue: tlsService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ name: 'profile' })
          }
        }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
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
      ciraConfigName: 'config1',
      tlsConfigName: null
    })
    component.confirm()

    expect(profileUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })
  it('should submit when valid (create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      ciraConfigName: 'config1',
      tlsConfigName: null
    })
    component.confirm()

    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should submit when valid with random passwords (create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
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

  it('should submit if cira config and static network are simultaneously selected and user confirms', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      tlsConfigName: null,
      userConsent: 'All',
      iderEnabled: 'true',
      kvmEnabled: 'true',
      solEnabled: 'true'
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPassword: 'Password123',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      tlsConfigName: null
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: '',
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      tlsConfigName: null
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: '',
      generateRandomPassword: true,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      tlsConfigName: null
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should submit when valid with only random mebx password + ccm activation', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'ccmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: true,
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'ccmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      tlsConfigName: null
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.isEdit = false
    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'ccmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: true,
      mebxPassword: '',
      dhcpEnabled: false,
      ciraConfigName: 'config1',
      tlsConfigName: null
    })
    component.confirm()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(profileCreateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should update the selected wifi configs on selecting a wifi profile', () => {
    component.selectedWifiConfigs = [{ priority: 1, profileName: 'home' }]
    const option: MatAutocompleteSelectedEvent = {
      option: {
        value: 'work'
      }
    } as any
    component.selectWifiProfile(option)
    expect(component.selectedWifiConfigs.length).toBe(2)
  })

  it('should update the selected wifi configs when a selected config is removed', () => {
    const wifiCfg01 = { priority: 1, profileName: 'home' }
    const wifiCfg02 = { priority: 2, profileName: 'work' }
    component.selectedWifiConfigs = [wifiCfg01, wifiCfg02]
    component.removeWifiProfile(wifiCfg02)
    expect(component.selectedWifiConfigs.length).toBe(1)
  })

  it('should adjust related fields on selecting activation mode', () => {
    component.activationChange('ccmactivate')
    expect(component.profileForm.controls.generateRandomMEBxPassword.disabled).toBe(true)
    expect(component.profileForm.controls.userConsent.disabled).toBe(true)
    expect(component.profileForm.controls.userConsent.value).toEqual('All')
    component.activationChange('acmactivate')
    expect(component.profileForm.controls.generateRandomMEBxPassword.disabled).toBe(false)
    expect(component.profileForm.controls.userConsent.disabled).toBe(false)
  })

  it('should return the search results when a search string is entered', () => {
    component.wirelessConfigurations = ['homeWiFi', 'officeWiFi']
    const searchString = 'home'
    const results = component.search(searchString)
    expect(results).toEqual(['homeWiFi'])
  })

  it('should update the list of tags when a tag is added ', () => {
    component.tags = [
      'acm',
      'ccm',
      'profile'
    ]
    const e = {
      value: '',
      chipInput: {
        clear: jasmine.createSpy()
      }
    }
    e.value = '  ccm '
    component.add(e as unknown as MatChipInputEvent)
    expect(component.tags).toEqual([
      'acm',
      'ccm',
      'profile'
    ])
    e.value = 'newtag'
    component.add(e as unknown as MatChipInputEvent)
    expect(component.tags).toEqual([
      'acm',
      'ccm',
      'newtag',
      'profile'
    ])
  })

  it('should update the list of tags when a tag is removed ', () => {
    component.tags = [
      'acm',
      'ccm',
      'profile'
    ]
    const tagName = 'ccm'
    component.remove(tagName)
    expect(component.tags).toEqual(['acm', 'profile'])
  })

  it('should turn amt visibility on when it is off', () => {
    component.amtInputType = 'password'
    component.toggleAMTPassVisibility()
    expect(component.amtInputType).toEqual('text')
  })

  it('should turn amt visibility off when it is on', () => {
    component.amtInputType = 'text'
    component.toggleAMTPassVisibility()
    expect(component.amtInputType).toEqual('password')
  })

  it('should turn mebx visibility on when it is off', () => {
    component.mebxInputType = 'password'
    component.toggleMEBXPassVisibility()
    expect(component.mebxInputType).toEqual('text')
  })

  it('should turn mebx visibility off when it is on', () => {
    component.mebxInputType = 'text'
    component.toggleMEBXPassVisibility()
    expect(component.mebxInputType).toEqual('password')
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
    expect(component.profileForm.controls.amtPassword.value.length).toBe(16)
  })

  it('should change the value of mebx password to a random strong password', () => {
    component.profileForm.controls.mebxPassword.setValue('1@qW')
    component.generateMEBXPassword()
    expect(component.profileForm.controls.mebxPassword.value.length).toBe(16)
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
      ciraConfigName: 'config1',
      tlsConfigName: null
    })
    component.confirm()

    expect(profileUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })
})
