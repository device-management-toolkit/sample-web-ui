/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from '../shared/shared.module'

import { ConfigsComponent } from './configs.component'
import { ConfigsService } from './configs.service'

describe('ConfigsComponent', () => {
  let component: ConfigsComponent
  let fixture: ComponentFixture<ConfigsComponent>
  let getDataSpy: jasmine.Spy

  beforeEach(async () => {
    const configsService = jasmine.createSpyObj('ConfigsService', ['getData'])
    getDataSpy = configsService.getData.and.returnValue(of([]))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [ConfigsComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ConfigsService, useValue: configsService }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDataSpy.calls.any()).toBe(true, 'getData called')
  })
})
