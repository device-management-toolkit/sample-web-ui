/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from '../shared/shared.module'

import { DomainsComponent } from './domains.component'
import { DomainsService } from './domains.service'

describe('DomainsComponent', () => {
  let component: DomainsComponent
  let fixture: ComponentFixture<DomainsComponent>
  let getDataSpy: jasmine.Spy

  beforeEach(async () => {
    const domainsService = jasmine.createSpyObj('DomainsService', ['getData'])
    getDataSpy = domainsService.getData.and.returnValue(of([]))

    await TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DomainsComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: DomainsService, useValue: domainsService }]

    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDataSpy.calls.any()).toBe(true, 'getData called')
  })
})
