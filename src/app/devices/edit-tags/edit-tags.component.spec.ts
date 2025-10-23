/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { DeviceEditTagsComponent } from './edit-tags.component'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatChipInputEvent } from '@angular/material/chips'
import { RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

describe('EditTagsComponent', () => {
  let component: DeviceEditTagsComponent
  let fixture: ComponentFixture<DeviceEditTagsComponent>
  let tags: string[]
  const dialogMock = {
    close: jasmine.createSpy('close')
  }

  beforeEach(() => {
    tags = ['tag1', 'tag2']
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceEditTagsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: tags },
        { provide: MatDialogRef, useValue: dialogMock }
      ]
    })
    fixture = TestBed.createComponent(DeviceEditTagsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should return false if done but no changes', () => {
    component.done()
    expect(dialogMock.close).toHaveBeenCalledWith(false)
  })

  it('should return false if cancelled', () => {
    component.remove('tag2')
    expect(tags).toEqual(['tag1'])
    component.cancel()
    expect(dialogMock.close).toHaveBeenCalledWith(false)
  })

  it('should add and remove tags', () => {
    const e = {
      value: ' newtag ',
      chipInput: {
        clear: jasmine.createSpy()
      }
    }
    component.add(e as unknown as MatChipInputEvent)
    expect(tags).toEqual([
      'newtag',
      'tag1',
      'tag2'
    ])
    component.remove('tag2')
    component.remove('newtag')
    expect(tags).toEqual(['tag1'])
    component.done()
    expect(dialogMock.close).toHaveBeenCalledWith(true)
  })
})
