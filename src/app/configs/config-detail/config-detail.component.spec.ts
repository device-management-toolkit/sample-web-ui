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
import { ConfigsService } from '../configs.service'

import { ConfigDetailComponent } from './config-detail.component'

describe('ConfigDetailComponent', () => {
  let component: ConfigDetailComponent
  let fixture: ComponentFixture<ConfigDetailComponent>
  let getRecordSpy: jasmine.Spy

  beforeEach(async () => {
    const configsService = jasmine.createSpyObj('ConfigsService', ['getRecord'])
    getRecordSpy = configsService.getRecord.and.returnValue(of({ serverAddressFormat: 3 }))

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [ConfigDetailComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ConfigsService, useValue: configsService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ name: 'name' }) }
        }]

    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getRecordSpy.calls.any()).toBe(true, 'getRecord called')
  })
})
