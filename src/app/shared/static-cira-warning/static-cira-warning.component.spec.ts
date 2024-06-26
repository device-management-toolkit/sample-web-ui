/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule } from '@angular/material/dialog'

import { StaticCIRAWarningComponent } from './static-cira-warning.component'

describe('StaticCIRAWarningComponent', () => {
  let component: StaticCIRAWarningComponent
  let fixture: ComponentFixture<StaticCIRAWarningComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, StaticCIRAWarningComponent]
})
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticCIRAWarningComponent)
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
