/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef } from '@angular/material/dialog'
import { DeviceEnableIderComponent } from './device-enable-ider.component'
import { RouterModule } from '@angular/router'
import { provideTranslateService } from '@ngx-translate/core'

describe('DeviceEnableIderComponent', () => {
  let component: DeviceEnableIderComponent
  let fixture: ComponentFixture<DeviceEnableIderComponent>
  const dialogMock = {
    close: jasmine.createSpy('close')
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        DeviceEnableIderComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: dialogMock }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceEnableIderComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    dialogMock.close = jasmine.createSpy('close')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
