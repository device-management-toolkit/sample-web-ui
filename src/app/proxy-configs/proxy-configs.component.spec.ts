/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj } from '../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of, throwError } from 'rxjs'

import { ProxyConfigsComponent } from './proxy-configs.component'
import { ProxyConfigsService } from './proxy-configs.service'
import { RouterModule } from '@angular/router'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('ProxyConfigsComponent', () => {
  let component: ProxyConfigsComponent
  let fixture: ComponentFixture<ProxyConfigsComponent>
  let getDataSpy: MockInstance
  let deleteSpy: MockInstance
  let translate: TranslateService

  beforeEach(() => {
    const proxyConfigsService = createSpyObj('ProxyConfigsService', ['getData', 'delete'])
    getDataSpy = proxyConfigsService.getData.mockReturnValue(
      of({
        data: [
          {
            name: 'test-proxy',
            address: '192.168.1.100',
            port: 8080,
            networkDnsSuffix: 'example.com',
            infoFormat: 1
          }
        ],
        totalCount: 1
      })
    )
    deleteSpy = proxyConfigsService.delete.mockReturnValue(of(null))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ProxyConfigsComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: ProxyConfigsService, useValue: proxyConfigsService },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProxyConfigsComponent)
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
    expect(getDataSpy).toHaveBeenCalled()
  })

  it('should navigate to new', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/proxy-configs/new'])
  })

  it('should navigate to existing', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo('test-proxy')
    expect(routerSpy).toHaveBeenCalledWith(['/proxy-configs/test-proxy'])
  })

  it('should delete successfully', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('test-proxy')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalledWith('test-proxy')
    expect(snackBarSpy).toHaveBeenCalledWith('Configuration deleted successfully', undefined, expect.any(Object))
  })

  it('should not delete when dialog is cancelled', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('test-proxy')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalled()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  it('should handle delete error with server message', () => {
    const errorResponse = { error: { message: 'Proxy profile: test is associated with an AMT Profile.' } }
    deleteSpy.mockReturnValue(throwError(() => errorResponse))

    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('test-proxy')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(deleteSpy).toHaveBeenCalledWith('test-proxy')
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Proxy profile: test is associated with an AMT Profile.',
      undefined,
      expect.any(Object)
    )
  })

  it('should handle delete error without server message', () => {
    const errorResponse = { error: {} }
    deleteSpy.mockReturnValue(throwError(() => errorResponse))

    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('test-proxy')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(deleteSpy).toHaveBeenCalledWith('test-proxy')
    expect(snackBarSpy).toHaveBeenCalledWith('Unable to delete configuration', undefined, expect.any(Object))
  })

  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy).toHaveBeenCalled()
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })

  it('should return true for isNoData when no data and not loading', () => {
    component.configs.data = []
    component.isLoading.set(false)
    expect(component.isNoData()).toBe(true)
  })

  it('should return false for isNoData when loading', () => {
    component.configs.data = []
    component.isLoading.set(true)
    expect(component.isNoData()).toBe(false)
  })

  it('should return false for isNoData when has data', () => {
    component.configs.data = [
      { name: 'test', address: '192.168.1.1', port: 8080, networkDnsSuffix: 'test.com', infoFormat: 1 }
    ]
    component.isLoading.set(false)
    expect(component.isNoData()).toBe(false)
  })

  it('should encode URI component', () => {
    const result = component.encodeURIComponent('test config')
    expect(result).toBe('test%20config')
  })
})
