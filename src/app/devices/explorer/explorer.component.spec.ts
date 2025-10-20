/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ExplorerComponent } from './explorer.component'
import { DevicesService } from '../devices.service'
import { ActivatedRoute } from '@angular/router'
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatDialogModule } from '@angular/material/dialog'
import { of } from 'rxjs'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ReactiveFormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { By } from '@angular/platform-browser'
import { TranslateModule } from '@ngx-translate/core'

describe('ExplorerComponent', () => {
  let component: ExplorerComponent
  let fixture: ComponentFixture<ExplorerComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(() => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getDevices',
      'updateDevice',
      'getTags',
      'getPowerState',
      'PowerStates',
      'sendPowerAction',
      'bulkPowerAction',
      'sendDeactivate',
      'sendBulkDeactivate',
      'getWsmanOperations',
      'executeExplorerCall'
    ])

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        BrowserModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatDialogModule,
        MonacoEditorModule,
        ExplorerComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: devicesServiceSpy },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { provide: NGX_MONACO_EDITOR_CONFIG, useValue: { onMonacoLoad: () => {} } },
        { provide: ActivatedRoute, useValue: { params: of({ id: '123' }) } }
      ]
    })

    devicesServiceSpy.getWsmanOperations.and.returnValue(of(['Operation1', 'Operation2']))
    devicesServiceSpy.executeExplorerCall.and.returnValue(of('<xml>Data</xml>'))

    fixture = TestBed.createComponent(ExplorerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize wsmanOperations and filteredOptions on ngOnInit', () => {
    expect(component.wsmanOperations).toEqual(['Operation1', 'Operation2'])
    expect(component.filteredOptions).toBeTruthy()
  })

  it('should update XMLData on input change', () => {
    fixture.componentRef.setInput('deviceId', '123')
    component.inputChanged({ option: { value: 'Operation2' } } as any)
    expect(component.selectedWsmanOperation).toBe('Operation2')
    expect(devicesServiceSpy.executeExplorerCall).toHaveBeenCalledWith('123', 'Operation2')
    expect(component.XMLData).toBe('<xml>Data</xml>')
  })

  it('should clear the input field when clearFilter is called', () => {
    component.myControl.setValue('Test Value')
    component.clearFilter()
    expect(component.myControl.value).toBe('')
  })

  it('should clear the input field when input is clicked', () => {
    component.myControl.setValue('Test Value')

    // Simulate click event on the input field
    const inputDebugElement = fixture.debugElement.query(By.css('input'))
    inputDebugElement.triggerEventHandler('click', null)

    expect(component.myControl.value).toBe('')
  })
})
