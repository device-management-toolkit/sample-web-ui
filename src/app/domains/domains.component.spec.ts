/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from '../shared/shared.module'

import { DomainsComponent } from './domains.component'
import { DomainsService } from './domains.service'

describe('DomainsComponent', () => {
  let component: DomainsComponent
  let fixture: ComponentFixture<DomainsComponent>
  let getDataSpy: jasmine.Spy
  let deleteSpy: jasmine.Spy

  beforeEach(async () => {
    const domainsService = jasmine.createSpyObj('DomainsService', ['getData', 'delete'])
    getDataSpy = domainsService.getData.and.returnValue(of({
      data: [{
        domainSuffix: 'vprodemo14.com',
        profileName: 'domain14',
        provisioningCertStorageFormat: 'string'
      }],
      totalCount: 1
    }))

    deleteSpy = domainsService.delete.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DomainsComponent],
      providers: [{ provide: DomainsService, useValue: domainsService }]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDataSpy.calls.any()).toBe(true, 'getData called')
    expect(component.isLoading).toBeFalse()
  })

  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy.calls.any()).toBe(true, 'getDevices called')
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })

  it('should navigate to new', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/domains/new'])
  })
  it('should navigate to existing', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/domains/path'])
  })

  it('should delete the domain on click of confirm delete', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.delete('domain1')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })

  it('should not delete the domain on cancel', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.delete('domain')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalledWith()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })
})
