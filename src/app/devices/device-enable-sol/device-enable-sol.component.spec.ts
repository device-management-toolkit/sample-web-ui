/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DeviceEnableSolComponent } from './device-enable-sol.component'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

describe('DeviceEnableSolComponent', () => {
  let component: DeviceEnableSolComponent
  let fixture: ComponentFixture<DeviceEnableSolComponent>
  const dialogMock = {
    close: jasmine.createSpy('close')
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceEnableSolComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogMock }]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceEnableSolComponent)
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
