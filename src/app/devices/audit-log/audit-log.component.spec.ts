/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { AuditLogComponent } from './audit-log.component'
import { DeviceLogService } from '../device-log.service'
import { TranslateModule } from '@ngx-translate/core'

describe('AuditLogComponent', () => {
  let component: AuditLogComponent
  let fixture: ComponentFixture<AuditLogComponent>
  let getAuditLogSpy: jasmine.Spy

  beforeEach(() => {
    const devicesService = jasmine.createSpyObj('DeviceLogService', ['getAuditLog'])
    getAuditLogSpy = devicesService.getAuditLog.and.returnValue(of({ totalCnt: 0, records: [] }))

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterModule,
        AuditLogComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DeviceLogService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        }
      ]
    })
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
