/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RemotePlatformEraseComponent } from './remote-platform-erase.component'
import { DevicesService } from '../devices.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { AMTFeaturesResponse } from 'src/models/models'

const mockAMTFeatures: AMTFeaturesResponse = {
  userConsent: 'none',
  KVM: true,
  SOL: true,
  IDER: true,
  redirection: true,
  optInState: 1,
  kvmAvailable: true,
  httpsBootSupported: false,
  ocr: false,
  winREBootSupported: false,
  localPBABootSupported: false,
  remoteErase: false,
  pbaBootFilesPath: [],
  winREBootFilesPath: { instanceID: '', biosBootString: '', bootString: '' }
}

describe('RemotePlatformEraseComponent', () => {
  let component: RemotePlatformEraseComponent
  let fixture: ComponentFixture<RemotePlatformEraseComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
  let matDialogSpy: jasmine.SpyObj<MatDialog>
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getAMTFeatures',
      'setAmtFeatures',
      'sendRemotePlatformErase'
    ])
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])

    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures }))
    devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures, remoteErase: true }))
    devicesServiceSpy.sendRemotePlatformErase.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [RemotePlatformEraseComponent, TranslateModule.forRoot()],
      providers: [
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(RemotePlatformEraseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should call getAMTFeatures on init', () => {
    expect(devicesServiceSpy.getAMTFeatures).toHaveBeenCalled()
  })

  it('should set isLoading to false after init completes', () => {
    expect(component.isLoading()).toBeFalse()
  })

  it('should populate featureForm with remoteErase value from AMT features', () => {
    expect(component.featureForm.get('remoteErase')?.value).toBeFalse()
  })

  it('should call setAmtFeatures when toggleFeature is called', () => {
    component.featureForm.get('remoteErase')?.setValue(true)
    component.toggleFeature()
    expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalled()
  })

  it('should show snackbar on toggleFeature success', () => {
    component.toggleFeature()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should show error snackbar when getAMTFeatures fails', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(throwError(() => new Error('error')))
    component.ngOnInit()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should show error snackbar when setAmtFeatures fails', () => {
    devicesServiceSpy.setAmtFeatures.and.returnValue(throwError(() => new Error('error')))
    component.toggleFeature()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should open confirmation dialog when initiateErase is called', () => {
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(matDialogSpy.open).toHaveBeenCalled()
  })

  it('should call sendRemotePlatformErase when erase is confirmed', () => {
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(devicesServiceSpy.sendRemotePlatformErase).toHaveBeenCalled()
  })

  it('should not call sendRemotePlatformErase when erase is cancelled', () => {
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(devicesServiceSpy.sendRemotePlatformErase).not.toHaveBeenCalled()
  })

  it('should show success snackbar after erase succeeds', () => {
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should show error snackbar when sendRemotePlatformErase fails', () => {
    devicesServiceSpy.sendRemotePlatformErase.and.returnValue(throwError(() => new Error('error')))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should update amtFeatures after successful toggleFeature', () => {
    devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures, remoteErase: true }))
    component.toggleFeature()
    expect(component.amtFeatures.remoteErase).toBeTrue()
  })

  it('should set isLoading to false after toggleFeature errors', () => {
    devicesServiceSpy.setAmtFeatures.and.returnValue(throwError(() => new Error('error')))
    component.toggleFeature()
    expect(component.isLoading()).toBeFalse()
  })
})
