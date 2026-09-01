/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'

import { GeneralComponent } from './general.component'
import { ActivatedRoute } from '@angular/router'
import { of, Subject } from 'rxjs'
import { DevicesService } from '../devices.service'
import { provideTranslateService } from '@ngx-translate/core'
import { By } from '@angular/platform-browser'

describe('GeneralComponent', () => {
  let component: GeneralComponent
  let fixture: ComponentFixture<GeneralComponent>
  let devicesServiceSpy: SpyObj<DevicesService>

  beforeEach(() => {
    devicesServiceSpy = createSpyObj('DevicesService', [
      'getDevices',
      'updateDevice',
      'getTags',
      'getPowerState',
      'getAMTVersion',
      'getAMTFeatures',
      'getAMTFeaturesCached',
      'getGeneralSettings',
      'PowerStates',
      'sendPowerAction',
      'bulkPowerAction',
      'sendDeactivate',
      'sendBulkDeactivate',
      'getWsmanOperations',
      'featuresChanges',
      'setAmtFeatures'
    ])
    const amtFeaturesResponse = {
      userConsent: 'ALL',
      KVM: true,
      SOL: true,
      IDER: true,
      redirection: true,
      optInState: 1,
      kvmAvailable: true,
      httpsBootSupported: true,
      ocr: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      rpe: true,
      rpeSupported: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    }
    devicesServiceSpy.getAMTFeatures.mockReturnValue(of(amtFeaturesResponse))
    devicesServiceSpy.getAMTFeaturesCached.mockReturnValue(of(amtFeaturesResponse))
    devicesServiceSpy.featuresChanges.mockReturnValue(of(null))
    devicesServiceSpy.getGeneralSettings.mockReturnValue(of({}))
    devicesServiceSpy.getAMTVersion.mockReturnValue(of(['']))
    TestBed.configureTestingModule({
      imports: [GeneralComponent],
      providers: [
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: { params: of({ id: 1 }) } },
        { provide: DevicesService, useValue: devicesServiceSpy }
      ]
    })

    fixture = TestBed.createComponent(GeneralComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should show warning when feature is enabled but redirection is false', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(false)
    fixture.changeDetectorRef.markForCheck()
    fixture.detectChanges()
    fixture.detectChanges()
    const icons = fixture.debugElement.queryAll(By.css('mat-icon'))
    const hasWarning = icons.some((el) => el.nativeElement.textContent.trim() === 'warning')
    expect(hasWarning).toBe(true)
  })

  it('should not show warning when redirection is true', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(true)
    fixture.detectChanges()
    const icons = fixture.debugElement.queryAll(By.css('mat-icon'))
    const hasWarning = icons.some((el) => el.nativeElement.textContent.trim() === 'warning')
    expect(hasWarning).toBe(false)
  })

  it('should not show warning when no features are enabled', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(false)
    component.amtEnabledFeatures.get('enableSOL')?.setValue(false)
    component.amtEnabledFeatures.get('enableIDER')?.setValue(false)
    component.amtEnabledFeatures.get('redirection')?.setValue(false)
    fixture.changeDetectorRef.markForCheck()
    fixture.detectChanges()
    fixture.detectChanges()
    const icons = fixture.debugElement.queryAll(By.css('mat-icon'))
    const hasWarning = icons.some((el) => el.nativeElement.textContent.trim() === 'warning')
    expect(hasWarning).toBe(false)
  })

  it('should report isRedirectionRequired when any feature is enabled', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('enableSOL')?.setValue(false)
    component.amtEnabledFeatures.get('enableIDER')?.setValue(false)
    expect(component.isRedirectionRequired).toBe(true)
  })

  it('should not require redirection when no features are enabled', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(false)
    component.amtEnabledFeatures.get('enableSOL')?.setValue(false)
    component.amtEnabledFeatures.get('enableIDER')?.setValue(false)
    expect(component.isRedirectionRequired).toBe(false)
  })

  it('should call setAmtFeatures when Enable button is clicked', () => {
    devicesServiceSpy.setAmtFeatures = vi.fn().mockReturnValue(of({}))
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(false)
    fixture.changeDetectorRef.markForCheck()
    fixture.detectChanges()
    fixture.detectChanges()
    const enableButton = fixture.debugElement.query(By.css('button'))
    enableButton.triggerEventHandler('click', null)
    expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalled()
  })

  it('shows ISM redirection warning text for ISM systems', () => {
    fixture.componentRef.setInput('isISM', true)
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(false)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('general.redirectionWarningISM.value')
    expect(fixture.nativeElement.textContent).not.toContain('general.redirectionWarning.value')
  })

  it('shows standard redirection warning text for non-ISM systems', () => {
    fixture.componentRef.setInput('isISM', false)
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(false)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('general.redirectionWarning.value')
    expect(fixture.nativeElement.textContent).not.toContain('general.redirectionWarningISM.value')
  })

  it('sends remoteErase from the loaded features, not the default', () => {
    devicesServiceSpy.setAmtFeatures = vi.fn().mockReturnValue(of({}))
    component.setAmtFeatures()
    expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ rpe: true })
    )
  })

  it('should update only feature loading state while setAmtFeatures is in flight', () => {
    const response$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.mockReturnValue(response$)
    const loadingBefore = component.isLoading()

    component.setAmtFeatures()

    expect(component.isUpdatingFeatures()).toBe(true)
    expect(component.isLoading()).toBe(loadingBefore)

    response$.next({ redirection: true, status: 'ok' })
    response$.complete()

    expect(component.isUpdatingFeatures()).toBe(false)
    expect(component.isLoading()).toBe(loadingBefore)
  })

  it('keeps summary loading state independent from feature update state', () => {
    const response$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.mockReturnValue(response$)

    component.isLoading.set(false)
    component.setAmtFeatures()

    expect(component.isLoading()).toBe(false)
    expect(component.isUpdatingFeatures()).toBe(true)

    response$.next({ redirection: true, status: 'ok' })
    response$.complete()

    expect(component.isLoading()).toBe(false)
    expect(component.isUpdatingFeatures()).toBe(false)
  })

  it('keeps feature loading state true until the last overlapping update completes', () => {
    const firstResponse$ = new Subject<any>()
    const secondResponse$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.mockReturnValueOnce(firstResponse$).mockReturnValueOnce(secondResponse$)

    component.setAmtFeatures()
    component.setAmtFeatures()

    expect(component.isUpdatingFeatures()).toBe(true)

    firstResponse$.next({ redirection: true, status: 'ok' })
    firstResponse$.complete()

    expect(component.isUpdatingFeatures()).toBe(true)

    secondResponse$.next({ redirection: true, status: 'ok' })
    secondResponse$.complete()

    expect(component.isUpdatingFeatures()).toBe(false)
  })

  it('keeps tracking an in-flight feature update after destroy until it completes', () => {
    const response$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.mockReturnValue(response$)

    component.setAmtFeatures()

    expect(component.isUpdatingFeatures()).toBe(true)

    component.ngOnDestroy()

    expect(component.isUpdatingFeatures()).toBe(true)

    response$.next({ redirection: true, status: 'ok' })
    response$.complete()

    expect(component.isUpdatingFeatures()).toBe(false)
  })
})
