/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { ProfilesComponent } from './profiles.component'
import { ProfilesService } from './profiles.service'
import { ServerFeaturesService } from '../server-features.service'
import { RouterModule } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { environment } from '../../environments/environment'

describe('ProfilesComponent', () => {
  let component: ProfilesComponent
  let fixture: ComponentFixture<ProfilesComponent>
  let getDataSpy: jasmine.Spy
  let deleteSpy: jasmine.Spy
  let serverFeaturesServiceSpy: jasmine.SpyObj<ServerFeaturesService>
  let translate: TranslateService

  beforeEach(() => {
    serverFeaturesServiceSpy = jasmine.createSpyObj('ServerFeaturesService', ['getFeatures'])
    serverFeaturesServiceSpy.getFeatures.and.returnValue(of({ ciraEnabled: true }))

    const profilesService = jasmine.createSpyObj('ProfilesService', ['getData', 'delete'])
    getDataSpy = profilesService.getData.and.returnValue(
      of({
        data: [
          {
            activation: 'acmactivate',
            ciraConfigName: 'ciraconfig1',
            dhcpEnabled: true,
            generateRandomMEBxPassword: false,
            generateRandomPassword: false,
            mebxPasswordLength: null,
            passwordLength: null,
            profileName: 'profile1',
            tags: [],
            wifiConfigs: [],
            tlsMode: 1
          }
        ],
        totalCount: 1
      })
    )
    deleteSpy = profilesService.delete.and.returnValue(of(null))

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ProfilesComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: ProfilesService, useValue: profilesService },
        { provide: ServerFeaturesService, useValue: serverFeaturesServiceSpy },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilesComponent)
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
    expect(getDataSpy.calls.any()).withContext('getData called').toBeTrue()
  })

  it('should navigate to new', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/profiles', 'new'])
  })
  it('should navigate to existing', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/profiles', 'path'])
  })
  it('should delete', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.delete('profile')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })
  it('should not delete', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.delete('profile')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalledWith()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })
  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy.calls.any()).withContext('getData called').toBeTrue()
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })
  it('should fetch features and set ciraEnabled false in enterprise mode when CIRA is disabled', () => {
    // cloudMode is captured from environment.cloud at construction, so flip it
    // to false and build a fresh component to exercise the enterprise fetch path.
    const originalCloud = environment.cloud
    ;(environment as { cloud: boolean }).cloud = false
    serverFeaturesServiceSpy.getFeatures.calls.reset()
    serverFeaturesServiceSpy.getFeatures.and.returnValue(of({ ciraEnabled: false }))

    const enterpriseFixture = TestBed.createComponent(ProfilesComponent)
    const enterpriseComponent = enterpriseFixture.componentInstance
    enterpriseFixture.detectChanges()

    expect(serverFeaturesServiceSpy.getFeatures).toHaveBeenCalled()
    expect(enterpriseComponent.ciraEnabled()).toBeFalse()
    ;(environment as { cloud: boolean }).cloud = originalCloud
  })

  it('should keep CIRA enabled in cloud mode without calling the features API', () => {
    // Default test env is cloud (environment.cloud === true): no features call, CIRA stays on.
    expect(component.cloudMode).toBeTrue()
    expect(serverFeaturesServiceSpy.getFeatures).not.toHaveBeenCalled()
    expect(component.ciraEnabled()).toBeTrue()
  })
})
