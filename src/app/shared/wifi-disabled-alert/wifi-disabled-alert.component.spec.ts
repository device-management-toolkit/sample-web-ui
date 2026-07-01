/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule } from '@angular/material/dialog'

import { WifiDisabledAlertComponent } from './wifi-disabled-alert.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('WifiDisabledAlertComponent', () => {
  let component: WifiDisabledAlertComponent
  let fixture: ComponentFixture<WifiDisabledAlertComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        WifiDisabledAlertComponent
      ],
      providers: [provideTranslateService()]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(WifiDisabledAlertComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
