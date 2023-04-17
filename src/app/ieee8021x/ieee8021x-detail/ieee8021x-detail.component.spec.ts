/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { IEEE8021xService } from '../ieee8021x.service'
import { IEEE8021xDetailComponent } from './ieee8021x-detail.component'
import * as IEEE8021x from 'src/app/ieee8021x/ieee8021x.constants'
import { AuthenticationProtocols } from 'src/app/ieee8021x/ieee8021x.constants'

describe('IEEE8021xDetailComponent', () => {
  let component: IEEE8021xDetailComponent
  let fixture: ComponentFixture<IEEE8021xDetailComponent>
  let ieee8021xGetRecordSpy: jasmine.Spy
  let ieee8021xCreateSpy: jasmine.Spy
  let ieee8021xUpdateSpy: jasmine.Spy
  const config01: IEEE8021x.Config = {
    profileName: 'name 1',
    authenticationProtocol: IEEE8021x.AuthenticationProtocols.EAP_TLS.value,
    pxeTimeout: 120,
    wiredInterface: false,
    version: ''
  }

  beforeEach(async () => {
    const ieee8021xService = jasmine.createSpyObj('IEEE8021xService',
      ['getRecord', 'update', 'create', 'refreshCountByInterface'])
    ieee8021xGetRecordSpy = ieee8021xService.getRecord.and.returnValue(of({}))
    ieee8021xCreateSpy = ieee8021xService.create.and.returnValue(of({}))
    ieee8021xUpdateSpy = ieee8021xService.update.and.returnValue(of({}))
    ieee8021xService.refreshCountByInterface.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [IEEE8021xDetailComponent],
      providers: [{ provide: IEEE8021xService, useValue: ieee8021xService }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ name: 'profile' })
        }
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(IEEE8021xDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(ieee8021xGetRecordSpy).toHaveBeenCalled()
  })

  it('should cancel', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/ieee8021x'])
  })
  it('should submit when valid (update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    component.ieee8021xForm.patchValue(config01)
    component.onSubmit()
    expect(ieee8021xUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should not submit form when invalid', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    component.ieee8021xForm.patchValue({
      profileName: 'profile1',
      userName: 'user'
    })
    component.onSubmit()

    expect(ieee8021xUpdateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should submit when valid (create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')

    component.isEdit = false
    component.ieee8021xForm.patchValue(config01)
    component.onSubmit()

    expect(ieee8021xCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should support subsets of all autthentication protocols', () => {
    expect(AuthenticationProtocols.forWiredInterface().length).toBeGreaterThan(0)
    expect(AuthenticationProtocols.forWirelessInterface().length).toBeGreaterThan(0)
  })
})
