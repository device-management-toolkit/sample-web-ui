/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'

import { AboutComponent } from './about.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('AboutComponent', () => {
  let component: AboutComponent
  let fixture: ComponentFixture<AboutComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatListModule,
        MatIconModule,
        MatDialogModule,
        AboutComponent
      ],
      providers: [provideTranslateService()]
    })
  })

  beforeEach(() => {
    localStorage.clear()
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
    localStorage.setItem('doNotShowAgain', 'true')
    const getItemSpy = vi.spyOn(localStorage, 'getItem')

    component.ngOnInit()

    expect(getItemSpy).toHaveBeenCalledWith('doNotShowAgain')
  })
})
