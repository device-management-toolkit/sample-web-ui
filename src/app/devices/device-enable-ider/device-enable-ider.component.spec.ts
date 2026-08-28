/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef } from '@angular/material/dialog'
import { DeviceEnableIderComponent } from './device-enable-ider.component'
import { RouterModule } from '@angular/router'
import { provideTranslateService } from '@ngx-translate/core'

describe('DeviceEnableIderComponent', () => {
  let component: DeviceEnableIderComponent
  let fixture: ComponentFixture<DeviceEnableIderComponent>
  const dialogMock = {
    close: vi.fn()
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
    dialogMock.close = vi.fn()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
