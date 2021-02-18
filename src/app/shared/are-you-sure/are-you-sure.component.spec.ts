/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'

import { AreYouSureDialogComponent } from './are-you-sure.component'

describe('AreYouSureComponent', () => {
  let component: AreYouSureDialogComponent
  let fixture: ComponentFixture<AreYouSureDialogComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AreYouSureDialogComponent]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AreYouSureDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
