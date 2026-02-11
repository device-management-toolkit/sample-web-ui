/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'

import { GeneralComponent } from './general.component'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { TranslateModule } from '@ngx-translate/core'
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
      'getGeneralSettings',
      'PowerStates',
      'sendPowerAction',
      'bulkPowerAction',
      'sendDeactivate',
      'sendBulkDeactivate',
      'getWsmanOperations'
    ])
    devicesServiceSpy.getAMTFeatures.and.returnValue(
      of({
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
      })
    )
    devicesServiceSpy.getGeneralSettings.and.returnValue(of({}))
    devicesServiceSpy.getAMTVersion.and.returnValue(of(['']))
    TestBed.configureTestingModule({
      imports: [GeneralComponent, TranslateModule.forRoot()],
      providers: [
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
})
