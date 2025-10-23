/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'

import { PowerUpAlertComponent } from './power-up-alert.component'
import { TranslateModule } from '@ngx-translate/core'

describe('PowerUpAlertComponent', () => {
  let component: PowerUpAlertComponent
  let fixture: ComponentFixture<PowerUpAlertComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatButtonModule,
        PowerUpAlertComponent,
        TranslateModule.forRoot()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerUpAlertComponent)
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
