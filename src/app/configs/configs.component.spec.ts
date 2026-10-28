/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj } from '../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'
import { signal } from '@angular/core'

import { ConfigsComponent } from './configs.component'
import { ConfigsService } from './configs.service'
import { LayoutService } from '../core/layout.service'
import { RouterModule } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('ConfigsComponent', () => {
  let component: ConfigsComponent
  let fixture: ComponentFixture<ConfigsComponent>
  let getDataSpy: MockInstance
  let deleteSpy: MockInstance
  let translate: TranslateService
  let layoutServiceStub: { isHandset: ReturnType<typeof signal<boolean>> }

  beforeEach(async () => {
    const configsService = createSpyObj('ConfigsService', ['getData', 'delete'])
    getDataSpy = configsService.getData.mockReturnValue(
      of({
        data: [
          {
            authMethod: 2,
            commonName: '52.172.14.137',
            configName: 'ciraconfig1',
            generateRandomPassword: false,
            mpsPort: 4433,
            mpsRootCertificate: 'string',
            mpsServerAddress: '52.172.14.137',
            passwordLength: null,
            proxyDetails: null,
            serverAddressFormat: 3
          }
        ],
        totalCount: 1
      })
    )
    deleteSpy = configsService.delete.mockReturnValue(of(null))
    layoutServiceStub = { isHandset: signal(false) }
    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        ConfigsComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: ConfigsService, useValue: configsService },
        { provide: LayoutService, useValue: layoutServiceStub },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigsComponent)
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

  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy.mock.calls.length > 0, 'getData called').toBe(true)
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })

  it('should navigate to existing', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/ciraconfigs', 'path'])
  })

  it('should navigate to new', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/ciraconfigs', 'new'])
  })

  it('should delete', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('ciraconfig1')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })

  describe('empty state', () => {
    const emptyState = (): HTMLElement | null => (fixture.nativeElement as HTMLElement).querySelector('app-empty-state')
    const loadNothing = (): void => {
      getDataSpy.mockReturnValue(of({ data: [], totalCount: 0 }))
      component.getData(component.pageEvent())
      fixture.detectChanges()
    }

    it('should not show when there are CIRA configs', () => {
      expect(emptyState()).toBeNull()
    })

    it('should explain what CIRA configs are for', () => {
      loadNothing()
      expect(emptyState()?.querySelector('h3')?.textContent).toContain('configs.ciraNoData.value')
      expect(emptyState()?.querySelector('p')?.textContent).toContain('configs.ciraNoDataDescription.value')
    })

    it('should start a new one from its button', () => {
      const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
      loadNothing()
      emptyState()!.querySelector('button')!.click()
      expect(routerSpy).toHaveBeenCalledWith(['/ciraconfigs', 'new'])
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
      expect(fixture.nativeElement.querySelector('.list-card').textContent).toContain('ciraconfig1')
    })
  })
})
