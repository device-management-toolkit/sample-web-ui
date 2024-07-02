/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ExplorerComponent } from './explorer.component'
import { DevicesService } from '../devices/devices.service'
import { ActivatedRoute } from '@angular/router'
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2'
import { of } from 'rxjs'

describe('ExplorerComponent', () => {
  let component: ExplorerComponent
  let fixture: ComponentFixture<ExplorerComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', ['getDevices', 'updateDevice', 'getTags', 'getPowerState', 'PowerStates', 'sendPowerAction', 'bulkPowerAction', 'sendDeactivate', 'sendBulkDeactivate', 'getWsmanOperations'])

    await TestBed.configureTestingModule({
      imports: [ExplorerComponent, MonacoEditorModule],
      providers: [{ provide: DevicesService, useValue: devicesServiceSpy },
        { provide: NGX_MONACO_EDITOR_CONFIG, useValue: { onMonacoLoad: () => {} } },
        { provide: ActivatedRoute, useValue: { params: { subscribe: () => {} } } }]
    })
    .compileComponents()
    devicesServiceSpy.getWsmanOperations.and.returnValue(of(['']))

    fixture = TestBed.createComponent(ExplorerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
