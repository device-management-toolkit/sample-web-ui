/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DeviceEnableKvmComponent } from './device-enable-kvm.component'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

describe('DeviceEnableKvmComponent', () => {
  let component: DeviceEnableKvmComponent
  let fixture: ComponentFixture<DeviceEnableKvmComponent>
  const dialogMock = {
    close: jasmine.createSpy('close')
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceEnableKvmComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogMock }]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceEnableKvmComponent)
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
