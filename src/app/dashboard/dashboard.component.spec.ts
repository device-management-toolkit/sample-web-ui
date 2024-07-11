/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { DevicesService } from '../devices/devices.service'
import { DashboardComponent } from './dashboard.component'
import { ActivatedRoute, RouterModule } from '@angular/router'

describe('DashboardComponent', () => {
  let component: DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>
  let getStatsSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getStats'])

    getStatsSpy = devicesService.getStats.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [RouterModule, DashboardComponent],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {}
        }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getStatsSpy).toHaveBeenCalled()
  })
})
