/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { IEEE8021xComponent } from './ieee8021x.component'
import { IEEE8021xService } from './ieee8021x.service'
import { RouterModule } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('IEEE8021xComponent', () => {
  let component: IEEE8021xComponent
  let fixture: ComponentFixture<IEEE8021xComponent>
  let getDataSpy: jasmine.Spy
  let deleteSpy: jasmine.Spy
  let translate: TranslateService

  beforeEach(() => {
    const ieee8021xService = jasmine.createSpyObj('IEEE8021xService', [
      'getData',
      'delete',
      'refreshCountByInterface'
    ])
    getDataSpy = ieee8021xService.getData.and.returnValue(
      of({
        data: [{}],
        totalCount: 1
      })
    )
    deleteSpy = ieee8021xService.delete.and.returnValue(of(null))
    ieee8021xService.refreshCountByInterface.and.returnValue(of({}))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        IEEE8021xComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: IEEE8021xService, useValue: ieee8021xService },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(IEEE8021xComponent)
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
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/ieee8021x/new'])
  })

  it('should navigate to existing', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/ieee8021x/path'])
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
    component.onPaginator({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy).toHaveBeenCalled()
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })
})
