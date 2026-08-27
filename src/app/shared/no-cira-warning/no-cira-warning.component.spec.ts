/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule } from '@angular/material/dialog'

import { NoCIRAWarningComponent } from './no-cira-warning.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('NoCIRAWarningComponent', () => {
  let component: NoCIRAWarningComponent
  let fixture: ComponentFixture<NoCIRAWarningComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        NoCIRAWarningComponent
      ],
      providers: [provideTranslateService()]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(NoCIRAWarningComponent)
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
