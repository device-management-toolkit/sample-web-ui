/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { ConfigsService } from 'src/app/configs/configs.service'
import { SharedModule } from 'src/app/shared/shared.module'
import { WirelessService } from 'src/app/wireless/wireless.service'
import { ProfilesService } from '../profiles.service'

import { ProfileDetailComponent } from './profile-detail.component'

describe('ProfileDetailComponent', () => {
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>
  let profileSpy: jasmine.Spy
  let configsSpy: jasmine.Spy
  let profileCreateSpy: jasmine.Spy
  let profileUpdateSpy: jasmine.Spy
  let wirelessConfigsSpy: jasmine.Spy
  beforeEach(async () => {
    const profilesService = jasmine.createSpyObj('ProfilesService', ['getRecord', 'update', 'create'])
    const configsService = jasmine.createSpyObj('ConfigsService', ['getData'])
    const wirelessService = jasmine.createSpyObj('WirelessService', ['getData'])
    const profileResponse = {
      profileName: 'profile1',
      amtPassword: 'P@ssw0rd',
      activation: 'ccmactivate',
      ciraConfigName: 'config1',
      dhcpEnabled: true,
      tags: ['acm'],
      wifiConfigs: [{ priority: 1, profileName: 'wifi' }]
    }
    profileSpy = profilesService.getRecord.and.returnValue(of(profileResponse))
    profileCreateSpy = profilesService.create.and.returnValue(of({}))
    profileUpdateSpy = profilesService.update.and.returnValue(of({}))
    configsSpy = configsService.getData.and.returnValue(of([]))
    wirelessConfigsSpy = wirelessService.getData.and.returnValue(of([]))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [ProfileDetailComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ProfilesService, useValue: profilesService },
        { provide: ConfigsService, useValue: configsService },
        { provide: WirelessService, useValue: wirelessService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ name: 'profile' })
          }
        }
      ]

    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(configsSpy.calls.any()).toBe(true, 'getData called')
    expect(profileSpy.calls.any()).toBe(true, 'getRecord called')
    expect(wirelessConfigsSpy.calls.any()).toBe(true)
  })

  it('should cancel', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/profiles'])
  })
  it('should submit when valid (update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      ciraConfigName: null
    })
    component.onSubmit()

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
      mebxPassword: 'Password123',
      dhcpEnabled: true,
      ciraConfigName: null
    })
    component.onSubmit()

    expect(profileCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should disable the cira config and wifi config when static network is selected', () => {
    component.networkConfigChange(false)
    expect(component.profileForm.controls.ciraConfigName.disabled).toBe(true)
  })

  it('should update the selected wifi configs on selecting a wifi profile', () => {
    component.selectedWifiConfigs = [{ priority: 1, profileName: 'home' }]
    const option: any = {
      option: {
        value: 'work'
      }
    }
    component.selectWifiProfile(option)
    expect(component.selectedWifiConfigs.length).toBe(2)
  })

  it('should update the selected wifi configs when a selected config is removed', () => {
    component.selectedWifiConfigs = [{ priority: 1, profileName: 'home' }, { priority: 2, profileName: 'work' }]

    const item: any = {
      priority: 2,
      profileName: 'work'
    }
    component.removeWifiProfile(item)
    expect(component.selectedWifiConfigs.length).toBe(2)
  })

  it('should disable mebx related fields on selecting CCM activate mode', () => {
    component.activationChange('ccmactivate')
    expect(component.profileForm.controls.mebxPassword.disabled).toBe(true)
  })

  it('should return the search results when a search string is entered', () => {
    component.wirelessConfigurations = ['homeWiFi', 'officeWiFi']
    const searchString = 'home'
    const results = component.search(searchString)

    expect(results).toEqual(['homeWiFi'])
  })

  it('should update the list of tags when a tag is removed ', () => {
    component.tags = ['acm', 'ccm', 'profile']
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
    component.amtInputType = 'password'
    component.toggleAMTPassVisibility()

    expect(component.amtInputType).toEqual('text')
  })

  it('should turn mebx visibility off when it is on', () => {
    component.amtInputType = 'text'
    component.toggleAMTPassVisibility()

    expect(component.amtInputType).toEqual('password')
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
    component.GenerateAMTPassword()

    expect(component.profileForm.controls.amtPassword.value.length).toBe(16)
  })

  it('should change the value of mebx password to a random strong password', () => {
    component.profileForm.controls.mebxPassword.setValue('1@qW')
    component.GenerateMEBXPassword()

    expect(component.profileForm.controls.mebxPassword.value.length).toBe(16)
  })

  it('should return the search results when a search string is entered', () => {
    component.wirelessConfigurations = ['homeWiFi', 'officeWiFi']
    const searchString = 'home'
    const results = component.search(searchString)

    expect(results).toEqual(['homeWiFi'])
  })

  it('should update the list of tags when a tag is removed ', () => {
    component.tags = ['acm', 'ccm', 'profile']
    const tagName = 'ccm'

    component.remove(tagName)

    expect(component.tags).toEqual(['acm', 'profile'])
  })

  it('should set the ciraconfigname property to null when No config option selected', () => {
    component.ciraConfigChange('No Config Selected')
    expect(component.profileForm.controls.ciraConfigName.value).toEqual(null)
  })

  it('should return the search results when a search string is entered', () => {
    component.wirelessConfigurations = ['homeWiFi', 'officeWiFi']
    const searchString = 'home'
    const results = component.search(searchString)

    expect(results).toEqual(['homeWiFi'])
  })

  it('should update the list of tags when a tag is removed ', () => {
    component.tags = ['acm', 'ccm', 'profile']
    const tagName = 'ccm'

    component.remove(tagName)

    expect(component.tags).toEqual(['acm', 'profile'])
  })
})
