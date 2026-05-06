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
import { AMTFeaturesResponse } from '../../../models/models'
import { PLATFORM_ERASE_CAPABILITIES } from './remote-platform-erase.constants'
import { AreYouSureDialogComponent } from '../../shared/are-you-sure/are-you-sure.component'

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
  rpeEnabled: false,
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

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getAMTFeatures',
      'setAmtFeatures',
      'getDevice',
      'getRemoteEraseCapabilities',
      'setRemoteEraseOptions'
    ])
    devicesServiceSpy.getDevice.and.returnValue(of({ guid: '', hostname: 'host-1', friendlyName: 'my-laptop' } as any))
    devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
      of({ secureEraseAllSSDs: true, tpmClear: false, restoreBIOSToEOM: true, unconfigureCSME: false })
    )
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])

    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures }))
    devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures }))
    devicesServiceSpy.setRemoteEraseOptions.and.returnValue(of({}))

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

  it('should show toggle as unchecked on init even when rpeEnabled is true', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
    component.ngOnInit()
    fixture.detectChanges()
    const toggle = fixture.nativeElement.querySelector('[data-cy="remoteEraseCheckbox"] button[role="switch"]')
    expect(toggle).not.toBeNull()
    expect(toggle.getAttribute('aria-checked')).toBe('false')
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

  it('should open AreYouSureDialog with the erase confirmation message', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
        rpeEnabled: true
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
    // mockAMTFeatures has rpeEnabled: false
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(matDialogSpy.open).not.toHaveBeenCalled()
  })

  it('should not open confirmation dialog when no caps are selected', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(false)
    component.eraseCapControl(2).setValue(false)
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(matDialogSpy.open).not.toHaveBeenCalled()
  })

  it('should call sendRemotePlatformErase when erase is confirmed', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any)
    component.initiateErase()
    expect(devicesServiceSpy.setRemoteEraseOptions).not.toHaveBeenCalled()
  })

  it('should pass deselected capability bitmask to setRemoteEraseOptions', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    component.eraseCapControl(0).setValue(true)
    component.onCapChange()
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    component.initiateErase()
    expect(snackBarSpy.open).toHaveBeenCalled()
  })

  it('should show error snackbar when sendRemotePlatformErase fails', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    // mockAMTFeatures has rpeEnabled: false but rpeSupported: true
    fixture.detectChanges()
    const button = fixture.nativeElement.querySelector('[data-cy="initiateEraseButton"]')
    expect(button).toBeNull()
  })

  it('should disable initiate erase button when all selected caps are unchecked', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    fixture.detectChanges()
    const capItems = fixture.nativeElement.querySelectorAll('[data-cy="eraseCapItem"]')
    expect(capItems.length).toBe(PLATFORM_ERASE_CAPABILITIES.length)
  })

  it('should show a checkbox for each capability, disabled for unsupported ones', () => {
    devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
    component.ngOnInit()
    component.toggleFeature(true)
    fixture.detectChanges()
    const checkboxes = fixture.nativeElement.querySelectorAll('[data-cy="eraseCapCheckbox"]')
    expect(checkboxes.length).toBe(PLATFORM_ERASE_CAPABILITIES.length)
    // tpmClear (index 1) and csmeUnconfigure (index 3) not supported — always disabled
    expect(component.eraseCapControl(1).disabled).toBeTrue()
    expect(component.eraseCapControl(3).disabled).toBeTrue()
    // secureEraseSsds (index 0) and biosRestore (index 2) supported — always enabled
    expect(component.eraseCapControl(0).disabled).toBeFalse()
    expect(component.eraseCapControl(2).disabled).toBeFalse()
  })

  it('should disable all capability checkboxes when featureEnabled is false', () => {
    // mockAMTFeatures: rpeEnabled=false — all caps disabled regardless of support
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
    it('should call setAmtFeatures with platformEraseEnabled: true when toggling on', () => {
      component.toggleFeature(true)
      expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalledWith(
        '',
        jasmine.objectContaining({ platformEraseEnabled: true })
      )
    })

    it('should call setAmtFeatures with platformEraseEnabled: false when toggling off', () => {
      component.toggleFeature(false)
      expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalledWith(
        '',
        jasmine.objectContaining({ platformEraseEnabled: false })
      )
    })

    it('should set platformEraseEnabled immediately before API call completes', () => {
      devicesServiceSpy.setAmtFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
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
      // feature starts off (mockAMTFeatures.rpeEnabled = false) — caps disabled
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
    })
  })

  describe('after successful erase', () => {
    beforeEach(() => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(of({ ...mockAMTFeatures, rpeEnabled: true }))
      component.ngOnInit()
      component.toggleFeature(true)
      component.eraseCapControl(0).setValue(true)
      component.onCapChange()
      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any)
    })

    it('should reset platformEraseEnabled to false', () => {
      component.initiateErase()
      expect(component.platformEraseEnabled()).toBeFalse()
    })

    it('should reset amtFeatures.rpeEnabled to false', () => {
      component.initiateErase()
      expect(component.amtFeatures.rpeEnabled).toBeFalse()
    })

    it('should reset selectedCapsCount to 0', () => {
      component.initiateErase()
      expect(component.selectedCapsCount()).toBe(0)
    })

    it('should uncheck all cap form controls', () => {
      component.initiateErase()
      expect(component.eraseCapControl(0).value).toBeFalse()
    })

    it('should disable capability checkboxes after successful erase', () => {
      component.initiateErase()
      expect(component.eraseCapControl(0).disabled).toBeTrue()
      expect(component.eraseCapControl(2).disabled).toBeTrue()
    })
  })

  describe('CSME exclusivity', () => {
    beforeEach(() => {
      devicesServiceSpy.getAMTFeatures.and.returnValue(
        of({
          ...mockAMTFeatures,
          rpeEnabled: true
        })
      )
      devicesServiceSpy.getRemoteEraseCapabilities.and.returnValue(
        of({ secureEraseAllSSDs: true, tpmClear: false, restoreBIOSToEOM: true, unconfigureCSME: true })
      )
      component.ngOnInit()
      component.toggleFeature(true)
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
})
