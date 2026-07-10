/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

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
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  beforeEach(() => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
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
      remoteErase: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    }
    devicesServiceSpy.getAMTFeatures.and.returnValue(of(amtFeaturesResponse))
    devicesServiceSpy.getAMTFeaturesCached.and.returnValue(of(amtFeaturesResponse))
    devicesServiceSpy.getGeneralSettings.and.returnValue(of({}))
    devicesServiceSpy.getAMTVersion.and.returnValue(of(['']))
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
    expect(hasWarning).toBeTrue()
  })

  it('should not show warning when redirection is true', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(true)
    fixture.detectChanges()
    const icons = fixture.debugElement.queryAll(By.css('mat-icon'))
    const hasWarning = icons.some((el) => el.nativeElement.textContent.trim() === 'warning')
    expect(hasWarning).toBeFalse()
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
    expect(hasWarning).toBeFalse()
  })

  it('should report isRedirectionRequired when any feature is enabled', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('enableSOL')?.setValue(false)
    component.amtEnabledFeatures.get('enableIDER')?.setValue(false)
    expect(component.isRedirectionRequired).toBeTrue()
  })

  it('should not require redirection when no features are enabled', () => {
    component.amtEnabledFeatures.get('enableKVM')?.setValue(false)
    component.amtEnabledFeatures.get('enableSOL')?.setValue(false)
    component.amtEnabledFeatures.get('enableIDER')?.setValue(false)
    expect(component.isRedirectionRequired).toBeFalse()
  })

  it('should call setAmtFeatures when Enable button is clicked', () => {
    devicesServiceSpy.setAmtFeatures = jasmine.createSpy().and.returnValue(of({}))
    component.amtEnabledFeatures.get('enableKVM')?.setValue(true)
    component.amtEnabledFeatures.get('redirection')?.setValue(false)
    fixture.changeDetectorRef.markForCheck()
    fixture.detectChanges()
    fixture.detectChanges()
    const enableButton = fixture.debugElement.query(By.css('button'))
    enableButton.triggerEventHandler('click', null)
    expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalled()
  })

  it('sends remoteErase from the loaded features, not the default', () => {
    devicesServiceSpy.setAmtFeatures = jasmine.createSpy().and.returnValue(of({}))
    component.setAmtFeatures()
    expect(devicesServiceSpy.setAmtFeatures).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.objectContaining({ remoteErase: true })
    )
  })

  it('should update only feature loading state while setAmtFeatures is in flight', () => {
    const response$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.and.returnValue(response$)
    const loadingBefore = component.isLoading()

    component.setAmtFeatures()

    expect(component.isUpdatingFeatures()).toBeTrue()
    expect(component.isLoading()).toBe(loadingBefore)

    response$.next({ redirection: true, status: 'ok' })
    response$.complete()

    expect(component.isUpdatingFeatures()).toBeFalse()
    expect(component.isLoading()).toBe(loadingBefore)
  })

  it('keeps summary loading state independent from feature update state', () => {
    const response$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.and.returnValue(response$)

    component.isLoading.set(false)
    component.setAmtFeatures()

    expect(component.isLoading()).toBeFalse()
    expect(component.isUpdatingFeatures()).toBeTrue()

    response$.next({ redirection: true, status: 'ok' })
    response$.complete()

    expect(component.isLoading()).toBeFalse()
    expect(component.isUpdatingFeatures()).toBeFalse()
  })

  it('keeps feature loading state true until the last overlapping update completes', () => {
    const firstResponse$ = new Subject<any>()
    const secondResponse$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.and.returnValues(firstResponse$, secondResponse$)

    component.setAmtFeatures()
    component.setAmtFeatures()

    expect(component.isUpdatingFeatures()).toBeTrue()

    firstResponse$.next({ redirection: true, status: 'ok' })
    firstResponse$.complete()

    expect(component.isUpdatingFeatures()).toBeTrue()

    secondResponse$.next({ redirection: true, status: 'ok' })
    secondResponse$.complete()

    expect(component.isUpdatingFeatures()).toBeFalse()
  })

  it('stops tracking an in-flight feature update when the component is destroyed', () => {
    const response$ = new Subject<any>()
    devicesServiceSpy.setAmtFeatures.and.returnValue(response$)

    component.setAmtFeatures()

    expect(component.isUpdatingFeatures()).toBeTrue()

    component.ngOnDestroy()

    expect(component.isUpdatingFeatures()).toBeFalse()
  })
})
