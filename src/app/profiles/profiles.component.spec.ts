/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'
import { signal } from '@angular/core'

import { ProfilesComponent } from './profiles.component'
import { ProfilesService } from './profiles.service'
import { LayoutService } from '../core/layout.service'
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
  let getDataSpy: MockInstance
  let deleteSpy: MockInstance
  let serverFeaturesServiceSpy: SpyObj<ServerFeaturesService>
  let translate: TranslateService
  let layoutServiceStub: { isHandset: ReturnType<typeof signal<boolean>> }

  beforeEach(() => {
    serverFeaturesServiceSpy = createSpyObj('ServerFeaturesService', ['getFeatures'])
    serverFeaturesServiceSpy.getFeatures.mockReturnValue(of({ ciraEnabled: true }))

    const profilesService = createSpyObj('ProfilesService', ['getData', 'delete'])
    getDataSpy = profilesService.getData.mockReturnValue(
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
    deleteSpy = profilesService.delete.mockReturnValue(of(null))
    layoutServiceStub = { isHandset: signal(false) }

    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        ProfilesComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: ProfilesService, useValue: profilesService },
        { provide: ServerFeaturesService, useValue: serverFeaturesServiceSpy },
        { provide: LayoutService, useValue: layoutServiceStub },
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
    expect(getDataSpy.mock.calls.length > 0, 'getData called').toBe(true)
  })

  it('should navigate to new', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/profiles', 'new'])
  })
  it('should navigate to existing', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/profiles', 'path'])
  })
  it('should delete', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('profile')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })
  it('should not delete', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('profile')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalledWith()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })
  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy.mock.calls.length > 0, 'getData called').toBe(true)
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })
  it('should fetch features and set ciraEnabled false in enterprise mode when CIRA is disabled', () => {
    const originalCloud = environment.cloud
    ;(environment as { cloud: boolean }).cloud = false
    try {
      serverFeaturesServiceSpy.getFeatures.mockClear()
      serverFeaturesServiceSpy.getFeatures.mockReturnValue(of({ ciraEnabled: false }))

      const enterpriseFixture = TestBed.createComponent(ProfilesComponent)
      const enterpriseComponent = enterpriseFixture.componentInstance
      enterpriseFixture.detectChanges()

      expect(enterpriseComponent.cloudMode).toBe(false)
      expect(serverFeaturesServiceSpy.getFeatures).toHaveBeenCalled()
      expect(enterpriseComponent.ciraEnabled()).toBe(false)
    } finally {
      ;(environment as { cloud: boolean }).cloud = originalCloud
    }
  })

  it('should keep CIRA enabled in cloud mode without calling the features API', () => {
    const originalCloud = environment.cloud
    ;(environment as { cloud: boolean }).cloud = true
    try {
      serverFeaturesServiceSpy.getFeatures.mockClear()

      const cloudFixture = TestBed.createComponent(ProfilesComponent)
      const cloudComponent = cloudFixture.componentInstance
      cloudFixture.detectChanges()

      expect(cloudComponent.cloudMode).toBe(true)
      expect(serverFeaturesServiceSpy.getFeatures).not.toHaveBeenCalled()
      expect(cloudComponent.ciraEnabled()).toBe(true)
    } finally {
      ;(environment as { cloud: boolean }).cloud = originalCloud
    }
  })

  describe('empty state', () => {
    const emptyState = (): HTMLElement | null => (fixture.nativeElement as HTMLElement).querySelector('app-empty-state')
    const loadNothing = (): void => {
      getDataSpy.mockReturnValue(of({ data: [], totalCount: 0 }))
      component.getData(component.pageEvent())
      fixture.detectChanges()
    }

    it('should not show when there are profiles', () => {
      expect(emptyState()).toBeNull()
    })

    it('should explain what profiles are for', () => {
      loadNothing()
      expect(emptyState()?.querySelector('h3')?.textContent).toContain('profiles.noData.value')
      expect(emptyState()?.querySelector('p')?.textContent).toContain('profiles.noDataDescription.value')
    })

    it('should start a new one from its button', () => {
      const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
      loadNothing()
      emptyState()!.querySelector('button')!.click()
      expect(routerSpy).toHaveBeenCalledWith(['/profiles', 'new'])
    })
  })

  describe('responsive card/table switch', () => {
    it('shows the table and hides the cards on desktop', () => {
      layoutServiceStub.isHandset.set(false)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.table-scroll mat-table')).not.toBeNull()
      expect(fixture.nativeElement.querySelector('.list-cards')).toBeNull()
    })

    it('shows the cards and hides the table on a handset', () => {
      layoutServiceStub.isHandset.set(true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.list-cards')).not.toBeNull()
      expect(fixture.nativeElement.querySelector('.table-scroll mat-table')).toBeNull()
      expect(fixture.nativeElement.querySelector('.list-card').textContent).toContain('profile1')
    })
  })
})
