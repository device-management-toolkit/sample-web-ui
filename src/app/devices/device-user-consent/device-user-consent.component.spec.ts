/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceUserConsentComponent } from './device-user-consent.component'
import { RouterModule } from '@angular/router'

describe('DeviceUserConsentComponent', () => {
  let component: DeviceUserConsentComponent
  let fixture: ComponentFixture<DeviceUserConsentComponent>
  let sendUserConsentCodeSpy: jasmine.Spy
  let cancelUserConsentCodeSpy: jasmine.Spy
  const dialogMock = {
    close: jasmine.createSpy('close')
  }

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['sendUserConsentCode', 'cancelUserConsentCode'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    sendUserConsentCodeSpy = devicesService.sendUserConsentCode.and.returnValue(
      of({ deviceId: 'deviceId', results: {} })
    )
    cancelUserConsentCodeSpy = devicesService.cancelUserConsentCode.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceUserConsentComponent
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        { provide: MAT_DIALOG_DATA, useValue: { deviceId: 'deviceId' } },
        { provide: MatDialogRef, useValue: dialogMock }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceUserConsentComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    dialogMock.close = jasmine.createSpy('close')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.userConsentForm).toBeDefined()
  })

  it('should submit userConsentForm', () => {
    component.userConsentForm.patchValue({
      consentCode: '123456'
    })
    expect(component.userConsentForm.valid).toBeTruthy()
    component.onSubmit()
    expect(sendUserConsentCodeSpy).toHaveBeenCalledWith('deviceId', '123456')
    expect(component.data.results).toEqual({ deviceId: 'deviceId', results: {} })
    expect(dialogMock.close).toHaveBeenCalled()
  })

  it('should not submit userConsentForm if invalid', () => {
    component.userConsentForm.patchValue({
      consentCode: '123'
    })
    expect(component.userConsentForm.valid).toBeFalsy()
    component.onSubmit()
    expect(sendUserConsentCodeSpy).not.toHaveBeenCalled()
    expect(dialogMock.close).not.toHaveBeenCalled()
  })

  it('should cancel and close the user concent dialog', () => {
    component.onCancel()
    expect(cancelUserConsentCodeSpy).toHaveBeenCalledWith('deviceId')
    expect(dialogMock.close).toHaveBeenCalled()
  })
})
