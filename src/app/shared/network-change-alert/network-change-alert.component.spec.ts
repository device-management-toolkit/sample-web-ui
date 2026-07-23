/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog'

import { NetworkChangeAlertComponent } from './network-change-alert.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('NetworkChangeAlertComponent', () => {
  let component: NetworkChangeAlertComponent
  let fixture: ComponentFixture<NetworkChangeAlertComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NetworkChangeAlertComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { messageKey: 'network.changeAlert.message.value' } }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkChangeAlertComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('exposes the injected message key', () => {
    expect(component.data.messageKey).toBe('network.changeAlert.message.value')
  })
})
