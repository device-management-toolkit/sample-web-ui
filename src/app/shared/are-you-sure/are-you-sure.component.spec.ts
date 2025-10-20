/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'

import { AreYouSureDialogComponent } from './are-you-sure.component'
import { TranslateModule } from '@ngx-translate/core'

describe('AreYouSureComponent', () => {
  let component: AreYouSureDialogComponent
  let fixture: ComponentFixture<AreYouSureDialogComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatButtonModule,
        AreYouSureDialogComponent,
        TranslateModule.forRoot()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AreYouSureDialogComponent)
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
