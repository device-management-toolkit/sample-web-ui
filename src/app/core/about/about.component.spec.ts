/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'

import { AboutComponent } from './about.component'

describe('AboutComponent', () => {
  let component: AboutComponent
  let fixture: ComponentFixture<AboutComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatListModule, MatIconModule, MatDialogModule, AboutComponent]
}).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize doNotShowAgain from localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue('true')
    component.ngOnInit()
    expect(localStorage.getItem).toHaveBeenCalledWith('doNotShowAgain')
  })
})
