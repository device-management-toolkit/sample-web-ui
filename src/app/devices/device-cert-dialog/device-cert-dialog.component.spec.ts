/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceCertDialogComponent } from './device-cert-dialog.component'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { provideTranslateService } from '@ngx-translate/core'

describe('DeviceCertDialogComponent', () => {
  let component: DeviceCertDialogComponent
  let fixture: ComponentFixture<DeviceCertDialogComponent>
  let devicesServiceSpy: SpyObj<DevicesService>
  let snackBarSpy: SpyObj<MatSnackBar>
  let dialogRefSpy: SpyObj<MatDialogRef<DeviceCertDialogComponent>>

  beforeEach(() => {
    const spyDevicesService = createSpyObj('DevicesService', [
      'pinDeviceCertificate',
      'deleteDeviceCertificate'
    ])
    const spySnackBar = createSpyObj('MatSnackBar', ['open'])
    const spyDialogRef = createSpyObj('MatDialogRef', ['close'])

    TestBed.configureTestingModule({
      imports: [DeviceCertDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: spyDevicesService },
        { provide: MatSnackBar, useValue: spySnackBar },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { certData: { guid: 'test-guid', sha256Fingerprint: 'test-fingerprint' }, isPinned: false }
        },
        { provide: MatDialogRef, useValue: spyDialogRef }
      ]
    })

    fixture = TestBed.createComponent(DeviceCertDialogComponent)
    component = fixture.componentInstance
    devicesServiceSpy = TestBed.inject(DevicesService) as SpyObj<DevicesService>
    snackBarSpy = TestBed.inject(MatSnackBar) as SpyObj<MatSnackBar>
    dialogRefSpy = TestBed.inject(MatDialogRef) as SpyObj<MatDialogRef<DeviceCertDialogComponent>>
  })

  it('should pin the device certificate and show a success message', () => {
    devicesServiceSpy.pinDeviceCertificate.mockReturnValue(of(null))

    component.pin()

    expect(devicesServiceSpy.pinDeviceCertificate).toHaveBeenCalledWith('test-guid', 'test-fingerprint')
    expect(snackBarSpy.open).toHaveBeenCalledWith('Certificate pinned', 'Close', SnackbarDefaults.defaultSuccess)
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true)
  })

  it('should remove the device certificate and show a success message', () => {
    devicesServiceSpy.deleteDeviceCertificate.mockReturnValue(of(null))

    component.remove()

    expect(devicesServiceSpy.deleteDeviceCertificate).toHaveBeenCalledWith('test-guid')
    expect(snackBarSpy.open).toHaveBeenCalledWith('Certificate removed', 'Close', SnackbarDefaults.defaultSuccess)
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false)
  })
})
