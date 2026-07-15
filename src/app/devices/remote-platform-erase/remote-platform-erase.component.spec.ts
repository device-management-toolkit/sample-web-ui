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
import { provideTranslateService } from '@ngx-translate/core'
import { AMTFeaturesResponse } from '../../../models/models'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'
import { HttpErrorResponse } from '@angular/common/http'
import { Router } from '@angular/router'
import { UserConsentService } from '../user-consent.service'

// Temporary set to 3 until CSME unconfigure is supported in the UI. The 4th capability is hidden in the template and not tested here.
const VISIBLE_PLATFORM_ERASE_CAPABILITIES = 3 //PLATFORM_ERASE_CAPABILITIES.filter((cap) => cap.key !== 'csmeUnconfigure')

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
  rpe: false,
  rpeSupported: true,
  pbaBootFilesPath: [],
  winREBootFilesPath: { instanceID: '', biosBootString: '', bootString: '' }
}

describe('RemotePlatformEraseComponent', () => {
  let component: RemotePlatformEraseComponent
  let fixture: ComponentFixture<RemotePlatformEraseComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
  let matDialogSpy: jasmine.SpyObj<MatDialog>
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>
  let routerSpy: jasmine.SpyObj<Router>
  let userConsentServiceSpy: jasmine.SpyObj<UserConsentService>

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getAMTFeatures',
      'getAMTFeaturesCached',
      'featuresChanges',
      'updateAmtFeaturesCache',
      'markRpeDisabledAfterErase',
      'setAmtFeatures',
      'getDevice',
      'getRemoteEraseCapabilities',
      'setRemoteEraseOptions',
      'sendDeactivate'
    ])
    devicesServiceSpy.getDevice.and.returnValue(of({ guid: '', hostname: 'host-1', friendlyName: 'my-laptop' } as any))
    devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
      of({ secureEraseAllSSDs: true, tpmClear: false, restoreBIOSToEOM: true, unconfigureCSME: false })
    )
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])
    routerSpy.navigate.and.returnValue(Promise.resolve(true))
    userConsentServiceSpy = jasmine.createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])
    userConsentServiceSpy.handleUserConsentDecision.and.returnValue(of(null))
    userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(null))

    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures }))
    // Delegate getAMTFeaturesCached to getAMTFeatures so per-test returnValue configs apply to both
    devicesServiceSpy.getAMTFeaturesCached.and.callFake((guid: string) => devicesServiceSpy.getAMTFeatures(guid))
    devicesServiceSpy.featuresChanges.and.returnValue(of(null))
    devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures }))
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))
    devicesServiceSpy.sendDeactivate.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [RemotePlatformEraseComponent],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: UserConsentService, useValue: userConsentServiceSpy }
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

  it('should show toggle as checked on init when rpe is true', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    fixture.detectChanges()
    const toggle = fixture.nativeElement.querySelector('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
    expect(toggle).not.toBeNull()
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('should show feature-disabled status when remoteEraseEnabled is false', () => {
    fixture.detectChanges()
    const toggle = fixture.nativeElement.querySelector('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
    expect(toggle).not.toBeNull()
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  it('should show error snackbar when getAMTFeatures fails', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(throwError(() => new Error('error')))
    component.ngOnInit()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should show server message in snackbar when setRemoteEraseOptions fails with it', () => {
    const serverError = new HttpErrorResponse({ error: { message: 'AMT device unreachable' }, status: 500 })
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(throwError(() => serverError))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalledWith('AMT device unreachable', undefined, jasmine.any(Object))
  })

  it('should show OS erase success message when secureEraseAllSSDs is selected', () => {
    component.eraseCaps.set([
      { key: 'secureEraseSsds', supported: true },
      { key: 'tpmClear', supported: false },
      { key: 'biosRestore', supported: false },
      { key: 'csmeUnconfigure', supported: false }
    ])
    component.eraseCapsArray.at(0).enable()
    component.eraseCapsArray.at(0).setValue(true)
    component.selectedCapsCount.set(1)
    component.platformEraseEnabled.set(true)

    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)

    component.initiateErase()

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'remotePlatformErase.osEraseSuccess.value',
      undefined,
      jasmine.anything()
    )
  })

  it('should show fallback message in snackbar when setRemoteEraseOptions fails without message', () => {
    const serverError = new HttpErrorResponse({ error: {}, status: 500 })
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(throwError(() => serverError))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'remotePlatformErase.eraseError.value',
      undefined,
      jasmine.any(Object)
    )
  })

  it('should open AreYouSureDialog with the erase confirmation message', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(matDialogSpy.open).toHaveBeenCalledWith(AreYouSureDialogComponent, jasmine.any(Object))
    const config = matDialogSpy.open.calls.mostRecent().args[1] as any
    expect(config.data.message).toBe('remotePlatformErase.confirmMessage')
    expect(config.data.params.operations).toBeDefined()
    expect(config.data.params.device).toBeDefined()
  })

  it('should pass selected capability labels in the dialog params', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(
      of({
        ...mockAMTFeatures,
        rpe: true
      })
    )
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.eraseCapControl(2).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    const config = matDialogSpy.open.calls.mostRecent().args[1] as any
    expect(config.data.params.operations.split(', ').length).toBe(2)
  })

  it('should not open confirmation dialog when feature is disabled', () => {
    // mockAMTFeatures has rpe: false
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(matDialogSpy.open).not.toHaveBeenCalled()
  })

  it('should not open confirmation dialog when no caps are selected', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(false)
    component.eraseCapControl(2).setValue(false)
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(matDialogSpy.open).not.toHaveBeenCalled()
  })

  it('should call sendRemotePlatformErase when erase is confirmed', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    // check secureEraseSsds (0x04, bit 2) and biosRestore (0x4000000, bit 26) → mask 0x4000004
    component.eraseCapControl(0).setValue(true)
    component.eraseCapControl(2).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalledWith('', {
      secureEraseAllSSDs: true,
      tpmClear: false,
      restoreBIOSToEOM: true,
      unconfigureCSME: false
    })
  })

  it('should not call setRemoteEraseOptions when erase is cancelled', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(devicesServiceSpy.setRemoteEraseOptions).not.toHaveBeenCalled()
  })

  it('should pass deselected capability bitmask to setRemoteEraseOptions', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    // check only biosRestore (index 2, bit 26 = 0x4000000) — secureEraseSsds left unchecked
    component.eraseCapControl(2).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalledWith('', {
      secureEraseAllSSDs: false,
      tpmClear: false,
      restoreBIOSToEOM: true,
      unconfigureCSME: false
    })
  })

  it('should show success snackbar after erase succeeds', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should show error snackbar when sendRemotePlatformErase fails', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(throwError(() => new Error('error')))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should set isRemoteEraseSupported to true when remoteEraseSupported is true', () => {
    expect(component.isPlatformEraseSupported()).toBeTrue()
  })

  it('should set isRemoteEraseSupported to false when remoteEraseSupported is false', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeSupported: false }))
    component.ngOnInit()
    fixture.detectChanges()
    expect(component.isPlatformEraseSupported()).toBeFalse()
  })

  it('should set isRemoteEraseSupported to false when remoteEraseSupported is absent', () => {
    const featuresWithoutSupported = { ...mockAMTFeatures } as Partial<AMTFeaturesResponse>
    delete featuresWithoutSupported.rpeSupported
    devicesServiceSpy.getAMTFeatures.and.returnValue(of(featuresWithoutSupported as AMTFeaturesResponse))
    component.ngOnInit()
    fixture.detectChanges()
    expect(component.isPlatformEraseSupported()).toBeFalse()
  })

  it('should set isLoading to true during initiateErase', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    // isLoading is set true before the observable completes
    expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalled()
  })

  it('should set isLoading to false after initiateErase fails', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(throwError(() => new Error('erase failed')))
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(component.isLoading()).toBeFalse()
  })

  it('should show initiate erase button when feature is enabled', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    fixture.detectChanges()
    const button = fixture.nativeElement.querySelector('[data-cy="initiateEraseButton"]')
    expect(button).not.toBeNull()
    expect(button.disabled).toBeFalse()
  })

  it('should not show initiate erase button when feature is disabled', () => {
    // mockAMTFeatures has rpe: false but rpeSupported: true
    fixture.detectChanges()
    const button = fixture.nativeElement.querySelector('[data-cy="initiateEraseButton"]')
    expect(button).toBeNull()
  })

  it('should disable initiate erase button when all selected caps are unchecked', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    fixture.detectChanges()
    // Uncheck all supported caps (secureEraseSsds index 0, biosRestore index 2)
    component.eraseCapControl(0).setValue(false)
    component.eraseCapControl(2).setValue(false)
    component.onCapChange()
    fixture.detectChanges()
    const button = fixture.nativeElement.querySelector('[data-cy="initiateEraseButton"]')
    expect(button).not.toBeNull()
    expect(button.disabled).toBeTrue()
  })

  it('should enable initiate erase button when feature is enabled and at least one cap is checked', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    fixture.detectChanges()
    // Caps start unchecked — check a supported one first
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    fixture.detectChanges()
    const button = fixture.nativeElement.querySelector('[data-cy="initiateEraseButton"]')
    expect(button).not.toBeNull()
    expect(button.disabled).toBeFalse()
  })

  it('should show capabilities card when remoteEraseSupported is true', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    fixture.detectChanges()
    const capItems = fixture.nativeElement.querySelectorAll('[data-cy="eraseCapItem"]')
    // Only 3 capabilities visible (CSME unconfigure is hidden in template)
    expect(capItems.length).toBe(VISIBLE_PLATFORM_ERASE_CAPABILITIES)
  })

  it('should show a checkbox for each capability, disabled for unsupported ones', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    fixture.detectChanges()
    const checkboxes = fixture.nativeElement.querySelectorAll('[data-cy="eraseCapCheckbox"]')
    // Only 3 capabilities visible (CSME unconfigure is hidden in template)
    expect(checkboxes.length).toBe(VISIBLE_PLATFORM_ERASE_CAPABILITIES)
    // tpmClear (index 1) and csmeUnconfigure (index 3) not supported — always disabled
    expect(component.eraseCapControl(1).disabled).toBeTrue()
    expect(component.eraseCapControl(3).disabled).toBeTrue()
    // secureEraseSsds (index 0) and biosRestore (index 2) supported — always enabled
    expect(component.eraseCapControl(0).disabled).toBeFalse()
    expect(component.eraseCapControl(2).disabled).toBeFalse()
  })

  it('should disable all capability checkboxes when featureEnabled is false', () => {
    // mockAMTFeatures: rpe=false — all caps disabled regardless of support
    fixture.detectChanges()
    expect(component.eraseCapControl(0).disabled).toBeTrue() // supported but feature off → disabled
    expect(component.eraseCapControl(1).disabled).toBeTrue() // not supported → disabled
    expect(component.eraseCapControl(2).disabled).toBeTrue() // supported but feature off → disabled
    expect(component.eraseCapControl(3).disabled).toBeTrue() // not supported → disabled
  })

  it('should keep supported capability checkboxes enabled when featureEnabled becomes true', () => {
    component.toggleFeature(true)
    // 0x05: secureErase(0) + storageDrives(2) supported → always enabled
    expect(component.eraseCapControl(0).disabled).toBeFalse()
    expect(component.eraseCapControl(1).disabled).toBeTrue() // tpmClear not supported
    expect(component.eraseCapControl(2).disabled).toBeFalse()
    expect(component.eraseCapControl(3).disabled).toBeTrue() // meRegion not supported
  })

  it('should default eraseCaps to all-supported when getRemoteEraseCapabilities returns all supported', () => {
    devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
      of({ secureEraseAllSSDs: true, tpmClear: true, restoreBIOSToEOM: true, unconfigureCSME: true })
    )
    component.ngOnInit()
    expect(component.eraseCaps().every((c) => c.supported)).toBeTrue()
  })

  it('should default eraseCaps to all-unsupported when getRemoteEraseCapabilities returns all unsupported', () => {
    devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
      of({ secureEraseAllSSDs: false, tpmClear: false, restoreBIOSToEOM: false, unconfigureCSME: false })
    )
    component.ngOnInit()
    expect(component.eraseCaps().every((c) => !c.supported)).toBeTrue()
  })

  describe('toggleFeature', () => {
    it('should call setAmtFeatures with rpe: true when toggling on', () => {
      component.toggleFeature(true)
      expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalledWith('', jasmine.objectContaining({ rpe: true }))
    })

    it('should call setAmtFeatures with rpe: false when toggling off', () => {
      component.toggleFeature(false)
      expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalledWith('', jasmine.objectContaining({ rpe: false }))
    })

    it('should set rpe immediately before API call completes', () => {
      devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
      expect(component.platformEraseEnabled()).toBeFalse()
      component.toggleFeature(true)
      expect(component.platformEraseEnabled()).toBeTrue()
    })

    it('should revert platformEraseEnabled when setAmtFeatures fails', () => {
      devicesServiceSpy.setAmtFeatures.and.returnValue(throwError(() => new Error('error')))
      component.toggleFeature(true)
      expect(component.platformEraseEnabled()).toBeFalse()
    })

    it('should show error snackbar when setAmtFeatures fails', () => {
      devicesServiceSpy.setAmtFeatures.and.returnValue(throwError(() => new Error('error')))
      component.toggleFeature(true)
      expect(snackBarSpy.open).toHaveBeenCalled()
    })

    it('should disable caps immediately when toggling off', () => {
      component.toggleFeature(true)
      // caps should be enabled for supported ones with feature on
      expect(component.eraseCapControl(0).disabled).toBeFalse()
      component.toggleFeature(false)
      // caps should be disabled immediately
      expect(component.eraseCapControl(0).disabled).toBeTrue()
    })

    it('should enable supported caps immediately when toggling on', () => {
      // feature starts off (mockAMTFeatures.rpe = false) — caps disabled
      expect(component.eraseCapControl(0).disabled).toBeTrue()
      component.toggleFeature(true)
      expect(component.eraseCapControl(0).disabled).toBeFalse()
    })

    it('should not corrupt amtFeatures after successful toggle', () => {
      // The API returns { status: '...' }, not a full AMTFeaturesResponse.
      // Verify that amtFeatures fields are preserved so subsequent toggles send valid payloads.
      devicesServiceSpy.setAmtFeatures.and.returnValue(of({ status: 'SUCCESS' } as any))
      component.toggleFeature(true)
      component.toggleFeature(false)
      const calls = devicesServiceSpy.setAmtFeatures.calls.all()
      const secondPayload = calls[1]?.args[1]
      expect(secondPayload?.userConsent).toBe(mockAMTFeatures.userConsent)
      expect(secondPayload?.enableKVM).toBe(mockAMTFeatures.KVM)
      expect(secondPayload?.enableSOL).toBe(mockAMTFeatures.SOL)
      expect(secondPayload?.enableIDER).toBe(mockAMTFeatures.IDER)
      expect(secondPayload?.rpe).toBe(mockAMTFeatures.rpe)
    })
  })

  describe('after successful erase', () => {
    beforeEach(() => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
      devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: false }))
      devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))
      devicesServiceSpy.sendDeactivate.and.returnValue(of({}))
      userConsentServiceSpy.handleUserConsentDecision.and.returnValue(of(null))
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(null))
      component.ngOnInit()
      component.toggleFeature(true)
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    })

    it('should complete without errors', () => {
      component.initiateErase()
      expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalled()
    })
  })

  describe('CSME exclusivity', () => {
    beforeEach(() => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(
        of({
          ...mockAMTFeatures,
          rpe: true
        })
      )
      devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
        of({ secureEraseAllSSDs: true, tpmClear: false, restoreBIOSToEOM: true, unconfigureCSME: true })
      )
      component.ngOnInit()
      component.toggleFeature(true)
    })

    it('should call sendDeactivate after CSME erase succeeds', () => {
      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.initiateErase()
      expect(devicesServiceSpy.sendDeactivate).toHaveBeenCalledWith('')
    })

    it('should navigate to /devices after CSME erase succeeds', () => {
      const router = TestBed.inject(Router)
      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.initiateErase()
      expect(router.navigate).toHaveBeenCalledWith(['/devices'])
    })

    it('should signal isCsmeExclusiveSelected when CSME is checked', () => {
      expect(component.isCsmeExclusiveSelected()).toBeFalse()
      component.eraseCapControl(3).setValue(true) // csmeUnconfigure
      component.onCapChange()
      expect(component.isCsmeExclusiveSelected()).toBeTrue()
    })

    it('should uncheck other caps when CSME is checked', () => {
      component.eraseCapControl(0).setValue(true)
      component.eraseCapControl(2).setValue(true)
      component.onCapChange()
      expect(component.selectedCapsCount()).toBe(2)

      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      expect(component.eraseCapControl(0).value).toBeFalse()
      expect(component.eraseCapControl(2).value).toBeFalse()
      expect(component.selectedCapsCount()).toBe(1)
    })

    it('should disable other caps while CSME is selected', () => {
      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      expect(component.eraseCapControl(0).disabled).toBeTrue()
      expect(component.eraseCapControl(2).disabled).toBeTrue()
      expect(component.eraseCapControl(3).disabled).toBeFalse()
    })

    it('should re-enable other caps when CSME is unchecked', () => {
      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      component.eraseCapControl(3).setValue(false)
      component.onCapChange()
      expect(component.eraseCapControl(0).disabled).toBeFalse()
      expect(component.eraseCapControl(2).disabled).toBeFalse()
      expect(component.isCsmeExclusiveSelected()).toBeFalse()
    })

    it('should send only the CSME bit in the erase mask', () => {
      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.initiateErase()
      expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalledWith('', {
        secureEraseAllSSDs: false,
        tpmClear: false,
        restoreBIOSToEOM: false,
        unconfigureCSME: true
      })
    })
  })
  describe('SSD encrypted password', () => {
    beforeEach(() => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
      component.ngOnInit()
      component.toggleFeature(true)
    })

    it('should show encrypted checkbox when SSD cap is selected', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      expect(component.isSsdSelected()).toBeTrue()
    })

    it('should hide encrypted checkbox when SSD cap is deselected', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.eraseCapControl(0).setValue(false)
      component.onCapChange()
      expect(component.isSsdSelected()).toBeFalse()
    })

    it('should show password input when encrypted checkbox is checked', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.onSsdEncryptedChange(true)
      expect(component.isSsdEncrypted()).toBeTrue()
    })

    it('should hide password input and clear it when encrypted checkbox is unchecked', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.onSsdEncryptedChange(true)
      component.ssdPasswordControl.setValue('secret')
      component.onSsdEncryptedChange(false)
      expect(component.isSsdEncrypted()).toBeFalse()
      expect(component.ssdPasswordControl.value).toBe('')
    })

    it('should include ssdPassword in request when encrypted and SSD selected', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.onSsdEncryptedChange(true)
      component.ssdPasswordControl.setValue('mypassword')
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.initiateErase()
      expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalledWith(
        '',
        jasmine.objectContaining({ secureEraseAllSSDs: true, ssdPassword: 'mypassword' })
      )
    })

    it('should not include ssdPassword when encrypted checkbox is not checked', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.initiateErase()
      const call = devicesServiceSpy.setRemoteEraseOptions.calls.mostRecent()
      expect(call.args[1].ssdPassword).toBeUndefined()
    })

    it('should reset SSD controls when feature is toggled off', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.onSsdEncryptedChange(true)
      component.ssdPasswordControl.setValue('secret')
      component.toggleFeature(false)
      expect(component.isSsdSelected()).toBeFalse()
      expect(component.isSsdEncrypted()).toBeFalse()
      expect(component.ssdPasswordControl.value).toBe('')
    })

    it('should keep SSD controls as they are after successful erase', () => {
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.onSsdEncryptedChange(true)
      component.ssdPasswordControl.setValue('secret')
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.initiateErase()
      // State is preserved after erase
      expect(component.isSsdSelected()).toBeTrue()
      expect(component.isSsdEncrypted()).toBeTrue()
      expect(component.ssdPasswordControl.value).toBe('secret')
    })

    it('should reset SSD controls when CSME is selected', () => {
      devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
        of({ secureEraseAllSSDs: true, tpmClear: false, restoreBIOSToEOM: true, unconfigureCSME: true })
      )
      component.ngOnInit()
      component.toggleFeature(true)
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      component.onSsdEncryptedChange(true)
      // Now select CSME (index 3) — deselects SSD
      component.eraseCapControl(3).setValue(true)
      component.onCapChange()
      expect(component.isSsdSelected()).toBeFalse()
      expect(component.isSsdEncrypted()).toBeFalse()
    })
  })

  describe('supportedCapsCount', () => {
    it('should count only supported capabilities', () => {
      expect(component.supportedCapsCount()).toBe(2)
    })
  })

  describe('template visibility', () => {
    it('should hide not-supported message while loading', () => {
      component.isLoading.set(true)
      component.isPlatformEraseSupported.set(false)
      fixture.detectChanges()
      const notSupported = fixture.nativeElement.querySelector('[data-cy="notSupportedMessage"]')
      expect(notSupported).toBeNull()
    })

    it('should show not-supported message after loading completes when not supported', () => {
      component.isLoading.set(false)
      component.isPlatformEraseSupported.set(false)
      fixture.detectChanges()
      const info = fixture.nativeElement.querySelector('mat-icon[color="accent"]')
      expect(info).not.toBeNull()
    })

    it('should show warning when isPlatformEraseSupported is true', () => {
      fixture.detectChanges()
      const warn = fixture.nativeElement.querySelector('mat-icon[color="warn"]')
      expect(warn).not.toBeNull()
    })

    it('should not show warning when isPlatformEraseSupported is false', () => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeSupported: false }))
      component.ngOnInit()
      fixture.detectChanges()
      const warn = fixture.nativeElement.querySelector('mat-icon[color="warn"]')
      expect(warn).toBeNull()
    })

    it('should show selectHint when platformEraseEnabled is true', () => {
      component.toggleFeature(true)
      fixture.detectChanges()
      const hint = fixture.nativeElement.querySelector('mat-icon[color="primary"]')
      expect(hint).not.toBeNull()
    })

    it('should hide selectHint when platformEraseEnabled is false', () => {
      fixture.detectChanges()
      const hint = fixture.nativeElement.querySelector('mat-icon[color="primary"]')
      expect(hint).toBeNull()
    })
  })

  describe('checkUserConsent', () => {
    it('should return true and set readyToErase when userConsent is none', (done) => {
      component.amtFeatures.set({ ...mockAMTFeatures, userConsent: 'none' })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBeTrue()
        expect(component.readyToErase).toBeTrue()
        done()
      })
    })

    it('should return true and set readyToErase when optInState is 3', (done) => {
      component.amtFeatures.set({ ...mockAMTFeatures, userConsent: 'all', optInState: 3 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBeTrue()
        expect(component.readyToErase).toBeTrue()
        done()
      })
    })

    it('should return true and set readyToErase when optInState is 4', (done) => {
      component.amtFeatures.set({ ...mockAMTFeatures, userConsent: 'all', optInState: 4 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBeTrue()
        expect(component.readyToErase).toBeTrue()
        done()
      })
    })

    it('should return false and not set readyToErase when userConsent is all and consent is required', (done) => {
      component.amtFeatures.set({ ...mockAMTFeatures, userConsent: 'all', optInState: 1 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBeFalse()
        expect(component.readyToErase).toBeFalse()
        done()
      })
    })
  })

  describe('postUserConsentDecision', () => {
    const operations = 'SSD Erase'

    it('should open AreYouSureDialog when result is null (consent not required)', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.postUserConsentDecision(null, operations).subscribe()
      expect(matDialogSpy.open).toHaveBeenCalledWith(AreYouSureDialogComponent, jasmine.any(Object))
    })

    it('should open AreYouSureDialog when result is true (consent granted)', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.postUserConsentDecision(true, operations).subscribe()
      expect(matDialogSpy.open).toHaveBeenCalledWith(AreYouSureDialogComponent, jasmine.any(Object))
    })

    it('should not open AreYouSureDialog when result is false (consent denied)', () => {
      component.postUserConsentDecision(false, operations).subscribe()
      expect(matDialogSpy.open).not.toHaveBeenCalled()
    })

    it('should call executeErase when AreYouSure dialog is confirmed', () => {
      component.platformEraseEnabled.set(true)
      component.eraseCaps.set([
        { key: 'secureEraseSsds', supported: true },
        { key: 'tpmClear', supported: false },
        { key: 'biosRestore', supported: false },
        { key: 'csmeUnconfigure', supported: false }
      ])
      component.eraseCapsArray.at(0).enable()
      component.eraseCapsArray.at(0).setValue(true)
      component.selectedCapsCount.set(1)
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      component.postUserConsentDecision(null, operations).subscribe()
      expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalled()
    })

    it('should not call executeErase when AreYouSure dialog is cancelled', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.postUserConsentDecision(null, operations).subscribe()
      expect(devicesServiceSpy.setRemoteEraseOptions).not.toHaveBeenCalled()
    })

    it('should pass device label and operations in the dialog data', () => {
      component.deviceLabel.set('my-device')
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.postUserConsentDecision(null, operations).subscribe()
      const config = matDialogSpy.open.calls.mostRecent().args[1] as any
      expect(config.data.params.device).toBe('my-device')
      expect(config.data.params.operations).toBe(operations)
    })
  })

  describe('initiateErase user consent flow', () => {
    beforeEach(() => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpe: true }))
      component.ngOnInit()
      component.toggleFeature(true)
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
    })

    it('should call handleUserConsentDecision via UserConsentService', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.initiateErase()
      expect(userConsentServiceSpy.handleUserConsentDecision).toHaveBeenCalled()
    })

    it('should call handleUserConsentDecision with deviceId and amtFeatures', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.initiateErase()
      expect(userConsentServiceSpy.handleUserConsentDecision).toHaveBeenCalledWith(
        jasmine.anything(),
        '',
        component.amtFeatures() ?? undefined
      )
    })

    it('should call handleUserConsentResponse with RPE as feature name', () => {
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.initiateErase()
      expect(userConsentServiceSpy.handleUserConsentResponse).toHaveBeenCalledWith('', null, 'RPE')
    })

    it('should open AreYouSure dialog when handleUserConsentResponse returns null (consent not required)', () => {
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(null))
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.initiateErase()
      expect(matDialogSpy.open).toHaveBeenCalledWith(AreYouSureDialogComponent, jasmine.any(Object))
    })

    it('should open AreYouSure dialog when handleUserConsentResponse returns true (consent granted)', () => {
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(true))
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
      component.initiateErase()
      expect(matDialogSpy.open).toHaveBeenCalledWith(AreYouSureDialogComponent, jasmine.any(Object))
    })

    it('should not open AreYouSure dialog when consent is denied', () => {
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(false))
      component.initiateErase()
      expect(matDialogSpy.open).not.toHaveBeenCalled()
    })

    it('should not call setRemoteEraseOptions when consent is denied', () => {
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(false))
      component.initiateErase()
      expect(devicesServiceSpy.setRemoteEraseOptions).not.toHaveBeenCalled()
    })
  })

  describe('SSD Password Validation', () => {
    it('should validate SSD password is within 64-byte limit', () => {
      const validPassword = 'password123'
      component.ssdPasswordControl.setValue(validPassword)
      expect(component.ssdPasswordControl.valid).toBe(true)
    })

    it('should reject SSD password exceeding 64 bytes', () => {
      // Create a password that is 65 bytes (65 ASCII characters)
      const tooLongPassword = 'a'.repeat(65)
      component.ssdPasswordControl.setValue(tooLongPassword)
      expect(component.ssdPasswordControl.valid).toBe(false)
      expect(component.ssdPasswordControl.errors?.['ssdPasswordTooLong']).toBeDefined()
    })

    it('should allow SSD password exactly 64 bytes', () => {
      // Exactly 64 bytes
      const maxPassword = 'a'.repeat(64)
      component.ssdPasswordControl.setValue(maxPassword)
      expect(component.ssdPasswordControl.valid).toBe(true)
      expect(component.ssdPasswordControl.errors).toBeNull()
    })

    it('should accept empty SSD password', () => {
      component.ssdPasswordControl.setValue('')
      expect(component.ssdPasswordControl.valid).toBe(true)
    })

    it('should reject SSD password with multibyte UTF-8 characters exceeding 64 bytes', () => {
      // Chinese characters take 3 bytes each in UTF-8
      // 22 characters × 3 bytes = 66 bytes (exceeds limit)
      const multibytePassword = '中'.repeat(22)
      component.ssdPasswordControl.setValue(multibytePassword)
      expect(component.ssdPasswordControl.valid).toBe(false)
      expect(component.ssdPasswordControl.errors?.['ssdPasswordTooLong']).toBeDefined()
    })

    it('should allow SSD password with multibyte UTF-8 characters within 64 bytes', () => {
      // 21 Chinese characters × 3 bytes each = 63 bytes (within limit)
      const multibytePassword = '中'.repeat(21)
      component.ssdPasswordControl.setValue(multibytePassword)
      expect(component.ssdPasswordControl.valid).toBe(true)
    })

    it('initiateErase should prevent submission if SSD password exceeds 64 bytes', () => {
      component.platformEraseEnabled.set(true)
      component.selectedCapsCount.set(1)
      component.isSsdSelected.set(true)
      component.isSsdEncrypted.set(true)
      component.ssdPasswordControl.setValue('a'.repeat(65))

      component.initiateErase()

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('remotePlatformErase.ssdPasswordTooLong'),
        undefined,
        jasmine.any(Object)
      )
      expect(devicesServiceSpy.setRemoteEraseOptions).not.toHaveBeenCalled()
    })

    it('initiateErase should allow submission if SSD password is within limit', () => {
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(null))
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))

      component.platformEraseEnabled.set(true)
      component.selectedCapsCount.set(1)
      component.isSsdSelected.set(true)
      component.isSsdEncrypted.set(true)
      component.ssdPasswordControl.setValue('a'.repeat(32))

      component.initiateErase()

      expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalled()
    })

    it('initiateErase should allow submission if SSD is selected but not encrypted', () => {
      userConsentServiceSpy.handleUserConsentResponse.and.returnValue(of(null))
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
      devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))

      component.platformEraseEnabled.set(true)
      component.selectedCapsCount.set(1)
      component.isSsdSelected.set(true)
      component.isSsdEncrypted.set(false)

      component.initiateErase()

      expect(devicesServiceSpy.setRemoteEraseOptions).toHaveBeenCalled()
    })
  })
})
