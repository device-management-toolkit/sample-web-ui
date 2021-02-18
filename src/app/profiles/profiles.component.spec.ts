/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from '../shared/shared.module'

import { ProfilesComponent } from './profiles.component'
import { ProfilesService } from './profiles.service'

describe('ProfilesComponent', () => {
  let component: ProfilesComponent
  let fixture: ComponentFixture<ProfilesComponent>
  let getDataSpy: jasmine.Spy

  beforeEach(async () => {
    const profilesService = jasmine.createSpyObj('ProfilesService', ['getData'])
    getDataSpy = profilesService.getData.and.returnValue(of([]))

    await TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [ProfilesComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: ProfilesService, useValue: profilesService }]

    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDataSpy.calls.any()).toBe(true, 'getData called')
  })
})
