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
      generateRandomPassword: false,
      activation: 'ccmactivate',
      ciraConfigName: 'config1',
      dhcpEnabled: true,
      generateRandomMEBxPassword: true,
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
  it('should toggle generateRandomMEBxPassword when false', () => {
    component.generateRandomMEBxPasswordChange(false)
    expect(component.profileForm.controls.mebxPassword.disabled).toBeFalse()
    expect(component.profileForm.controls.mebxPasswordLength.disabled).toBeTrue()
  })
  it('should toggle generateRandomMEBxPassword when true', () => {
    component.generateRandomMEBxPasswordChange(true)
    expect(component.profileForm.controls.mebxPassword.disabled).toBeTrue()
    expect(component.profileForm.controls.mebxPasswordLength.disabled).toBeFalse()
  })
  it('should toggle generateRandomMEBxPassword when false', () => {
    component.generateRandomPasswordChange(false)
    expect(component.profileForm.controls.amtPassword.disabled).toBeFalse()
    expect(component.profileForm.controls.passwordLength.disabled).toBeTrue()
  })
  it('should toggle generateRandomMEBxPassword when true', () => {
    component.generateRandomPasswordChange(true)
    expect(component.profileForm.controls.amtPassword.disabled).toBeTrue()
    expect(component.profileForm.controls.passwordLength.disabled).toBeFalse()
  })
  it('should submit when valid (update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.profileForm.patchValue({
      profileName: 'profile',
      activation: 'acmactivate',
      amtPassword: 'Password123',
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: null,
      passwordLength: null,
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
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: null,
      passwordLength: null,
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
    expect(component.profileForm.controls.generateRandomMEBxPassword.disabled).toBe(true)
  })

  it('should set the ciraconfigname property to null when No config option selected', () => {
    component.ciraConfigChange('No Config Selected')
    expect(component.profileForm.controls.ciraConfigName.value).toEqual(null)
  })
})
