/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule } from '@angular/material/dialog'

import { RandomPassAlertComponent } from './random-pass-alert.component'

describe('RandomPassAlertComponent', () => {
  let component: RandomPassAlertComponent
  let fixture: ComponentFixture<RandomPassAlertComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, RandomPassAlertComponent]
})
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(RandomPassAlertComponent)
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
