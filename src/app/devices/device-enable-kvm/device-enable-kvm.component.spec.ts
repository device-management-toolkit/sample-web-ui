/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DeviceEnableKvmComponent } from './device-enable-kvm.component'
import { RouterModule } from '@angular/router'
import { provideTranslateService } from '@ngx-translate/core'

describe('DeviceEnableKvmComponent', () => {
  let component: DeviceEnableKvmComponent
  let fixture: ComponentFixture<DeviceEnableKvmComponent>
  const dialogMock = {
    close: vi.fn()
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceEnableKvmComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: dialogMock }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceEnableKvmComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    dialogMock.close = vi.fn()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
