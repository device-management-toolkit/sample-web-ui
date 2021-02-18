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
import { ConfigsService } from 'src/app/configs/configs.service'
import { SharedModule } from 'src/app/shared/shared.module'
import { ProfilesService } from '../profiles.service'

import { ProfileDetailComponent } from './profile-detail.component'

describe('ProfileDetailComponent', () => {
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>
  let profileSpy: jasmine.Spy
  let configsSpy: jasmine.Spy
  beforeEach(async () => {
    const profilesService = jasmine.createSpyObj('ProfilesService', ['getRecord'])
    const configsService = jasmine.createSpyObj('ConfigsService', ['getData'])
    profileSpy = profilesService.getRecord.and.returnValue(of({}))
    configsSpy = configsService.getData.and.returnValue(of([]))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [ProfileDetailComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ProfilesService, useValue: profilesService },
        { provide: ConfigsService, useValue: configsService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ name: 'profile' })
          }
        }
      ]

    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(configsSpy.calls.any()).toBe(true, 'getData called')
    expect(profileSpy.calls.any()).toBe(true, 'getRecord called')
  })
})
