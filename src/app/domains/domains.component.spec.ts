/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { DomainsComponent } from './domains.component'
import { DomainsService } from './domains.service'
import { Domain, DataWithCount } from '../../models/models'
import { RouterModule } from '@angular/router'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('DomainsComponent', () => {
  let component: DomainsComponent
  let fixture: ComponentFixture<DomainsComponent>
  let getDataSpy: MockInstance
  let deleteSpy: MockInstance
  let domainsService: SpyObj<DomainsService>
  let translate: TranslateService

  beforeEach(() => {
    domainsService = createSpyObj('DomainsService', ['getData', 'delete'])

    const today = new Date()
    const okayDate = new Date(today)
    const warnDate = new Date(today)
    const expDate = new Date(today)

    okayDate.setMonth(today.getMonth() + 3)
    warnDate.setMonth(today.getMonth() + 1)
    expDate.setMonth(today.getMonth() - 2)
    const domains: Domain[] = [
      {
        domainSuffix: 'vprodemo1.com',
        profileName: 'domain1',
        provisioningCertStorageFormat: 'string',
        expirationDate: okayDate
      },
      {
        domainSuffix: 'vprodemo2.com',
        profileName: 'domain2',
        provisioningCertStorageFormat: 'string',
        expirationDate: warnDate
      },
      {
        domainSuffix: 'vprodemo3.com',
        profileName: 'domain3',
        provisioningCertStorageFormat: 'string',
        expirationDate: expDate
      }
    ] as any

    getDataSpy = domainsService.getData.mockReturnValue(
      of({
        data: domains,
        totalCount: 3
      } satisfies DataWithCount<Domain>)
    )

    deleteSpy = domainsService.delete.mockReturnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DomainsComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DomainsService, useValue: domainsService },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainsComponent)
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
    expect(component.isLoading()).toBe(false)
  })

  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy.mock.calls.length > 0, 'getDevices called').toBe(true)
    expect(component.paginator.length).toBe(3)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })

  it('should navigate to new', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/domains/new'])
  })
  it('should navigate to existing', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/domains/path'])
  })

  it('should delete the domain on click of confirm delete', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('domain1')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })

  it('should not delete the domain on cancel', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.delete('domain')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalledWith()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  it('should get the remaining time given a date', () => {
    // Set dates for expiration test
    const today = new Date()
    const okayDate = new Date(today)
    const warnDate = new Date(today)
    const expDate = new Date(today)
    const longDate = new Date(today)

    okayDate.setDate(today.getDate() + 95)
    warnDate.setTime(today.getTime() + 86000000 * 31)
    expDate.setMonth(today.getMonth() - 2)
    longDate.setFullYear(today.getFullYear() + 5)

    expect(component.getRemainingTime(okayDate)).toEqual('3domains.monthsRemaining.value')
    expect(component.getRemainingTime(warnDate)).toEqual('30domains.daysRemaining.value')
    expect(component.getRemainingTime(expDate)).toEqual('domains.expired.value')
    expect(component.getRemainingTime(longDate)).toEqual('5domains.yearsRemaining.value')
  })

  it('should ', () => {
    const snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    component.expirationWarning()
    expect(snackBarSpy).toHaveBeenCalled()
  })
})
