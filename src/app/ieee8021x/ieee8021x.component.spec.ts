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

import { IEEE8021xComponent } from './ieee8021x.component'
import { IEEE8021xService } from './ieee8021x.service'

describe('IEEE8021xComponent', () => {
  let component: IEEE8021xComponent
  let fixture: ComponentFixture<IEEE8021xComponent>
  let getDataSpy: jasmine.Spy
  let deleteSpy: jasmine.Spy

  beforeEach(async () => {
    const ieee8021xService = jasmine.createSpyObj('IEEE8021xService', ['getData', 'delete', 'refreshCountByInterface'])
    getDataSpy = ieee8021xService.getData.and.returnValue(of({
      data: [{ }],
      totalCount: 1
    }))
    deleteSpy = ieee8021xService.delete.and.returnValue(of(null))
    ieee8021xService.refreshCountByInterface.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [IEEE8021xComponent],
      providers: [{ provide: IEEE8021xService, useValue: ieee8021xService }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(IEEE8021xComponent)
    component = fixture.componentInstance
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
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
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
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
