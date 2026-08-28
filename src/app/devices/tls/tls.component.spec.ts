/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TLSComponent } from './tls.component'
import { DevicesService } from '../devices.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { provideTranslateService } from '@ngx-translate/core'

describe('TLSComponent', () => {
  let component: TLSComponent
  let fixture: ComponentFixture<TLSComponent>
  let mockDevicesService: any
  let mockSnackBar: any
  const mockTLSData = [{}, {}]

  beforeEach(() => {
    mockDevicesService = createSpyObj('DevicesService', ['getTLSSettings'])
    mockSnackBar = createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatDividerModule,
        TLSComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(TLSComponent)
    component = fixture.componentInstance

    fixture.componentRef.setInput('deviceId', 'test-device-id')
    mockDevicesService.getTLSSettings.mockReturnValue(of(mockTLSData))
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should call getTLSSettings on ngOnInit and set tlsData', () => {
    component.ngOnInit()

    expect(mockDevicesService.getTLSSettings).toHaveBeenCalledWith('test-device-id')
    expect(component.tlsData).toEqual(mockTLSData)
    expect(component.isLoading()).toBe(false)
  })
})
