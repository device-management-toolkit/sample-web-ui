/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { DomainsService } from '../domains.service'

import { DomainDetailComponent } from './domain-detail.component'

describe('DomainDetailComponent', () => {
  let component: DomainDetailComponent
  let fixture: ComponentFixture<DomainDetailComponent>
  let getRecordSpy: jasmine.Spy

  beforeEach(async () => {
    const domainsService = jasmine.createSpyObj('DomainsService', ['getRecord'])
    getRecordSpy = domainsService.getRecord.and.returnValue(of([]))

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DomainDetailComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: DomainsService, useValue: domainsService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ name: 'name' }) }
        }]

    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getRecordSpy.calls.any()).toBe(true, 'getRecord called')
  })
})
