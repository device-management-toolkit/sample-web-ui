/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'

import { AuditLogComponent } from './audit-log.component'

fdescribe('AuditLogComponent', () => {
  let component: AuditLogComponent
  let fixture: ComponentFixture<AuditLogComponent>
  let getAuditLogSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getAuditLog'])
    getAuditLogSpy = devicesService.getAuditLog.and.returnValue(of({ totalCnt: 0, records: [] }))

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterModule,
        AuditLogComponent
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditLogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getAuditLogSpy.calls.any()).toBe(true, 'getAuditLog called')
  })
})
