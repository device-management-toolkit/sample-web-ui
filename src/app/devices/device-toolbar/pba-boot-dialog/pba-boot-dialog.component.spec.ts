/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { ReactiveFormsModule } from '@angular/forms'
import { DebugElement } from '@angular/core'
import { By } from '@angular/platform-browser'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { PBABootDialogComponent } from './pba-boot-dialog.component'

describe('PBABootDialogComponent', () => {
  let component: PBABootDialogComponent
  let fixture: ComponentFixture<PBABootDialogComponent>
  let debugElement: DebugElement
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PBABootDialogComponent>>
  let translate: TranslateService

  const mockBootParams = [
    { instanceID: 'Intel(r) AMT: Force OCR UEFI Boot Option 1', bootString: 'path1.efi', biosBootString: 'PBA OEM' },
    { instanceID: 'Intel(r) AMT: Force OCR UEFI Boot Option 2', bootString: 'path2.efi', biosBootString: 'PBA OEM1' },
    { instanceID: 'Intel(r) AMT: Force OCR UEFI Boot Option 3', bootString: 'path3.efi', biosBootString: 'PBA OEM2' }
  ]

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close'])

    const mockDialogData = {
      pbaBootFilesPath: mockBootParams
    }

    TestBed.configureTestingModule({
      imports: [
        PBABootDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    fixture = TestBed.createComponent(PBABootDialogComponent)
    component = fixture.componentInstance
    debugElement = fixture.debugElement
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with provided boot file paths', () => {
    expect(component.pbaBootFilePaths).toEqual(mockBootParams)
  })

  it('should initialize form with required validators', () => {
    expect(component.bootForm).toBeDefined()

    const selectedBootParamControl = component.bootForm.get('selectedBootParam')
    expect(selectedBootParamControl?.hasError('required')).toBeTruthy()

    const secureBootControl = component.bootForm.get('enforceSecureBoot')
    expect(secureBootControl?.valid).toBeTruthy()
  })

  it('should initialize form with default values', () => {
    expect(component.bootForm.get('selectedBootParam')?.value).toBe(null)
    expect(component.bootForm.get('enforceSecureBoot')?.value).toBe(true)
  })

  it('should mark form as invalid when no boot param is selected', () => {
    const selectedBootParamControl = component.bootForm.get('selectedBootParam')
    expect(selectedBootParamControl?.valid).toBeFalsy()
    expect(selectedBootParamControl?.hasError('required')).toBeTruthy()
    expect(component.bootForm.valid).toBeFalsy()
  })

  it('should mark form as valid when boot param is selected', () => {
    const selectedBootParamControl = component.bootForm.get('selectedBootParam')
    selectedBootParamControl?.setValue(mockBootParams[0])
    fixture.detectChanges()

    expect(selectedBootParamControl?.valid).toBeTruthy()
    expect(component.bootForm.valid).toBeTruthy()
  })

  it('should call onCancel and close dialog when Cancel button is clicked', () => {
    component.onCancel()
    expect(dialogRefSpy.close).toHaveBeenCalled()
  })

  it('should disable OK button when form is invalid', () => {
    const okButton = debugElement.query(By.css('button[color="primary"]'))
    expect(okButton.nativeElement.disabled).toBeTruthy()
  })

  it('should enable OK button when form is valid', () => {
    component.bootForm.get('selectedBootParam')?.setValue(mockBootParams[0])
    fixture.detectChanges()

    const okButton = debugElement.query(By.css('button[color="primary"]'))
    expect(okButton.nativeElement.disabled).toBeFalsy()
  })

  it('should call onSubmit and close dialog with boot details when OK button is clicked', () => {
    const selectedBootParam = mockBootParams[0]
    const expectedBootDetails = {
      bootFilePath: selectedBootParam.bootString,
      instanceID: selectedBootParam.instanceID,
      enforceSecureBoot: true
    }

    component.bootForm.get('selectedBootParam')?.setValue(selectedBootParam)
    component.bootForm.get('enforceSecureBoot')?.setValue(true)
    fixture.detectChanges()

    component.onSubmit()
    expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedBootDetails)
  })

  it('should call onSubmit and close dialog with correct enforce secure boot value', () => {
    const selectedBootParam = mockBootParams[1]
    const expectedBootDetails = {
      bootFilePath: selectedBootParam.bootString,
      instanceID: selectedBootParam.instanceID,
      enforceSecureBoot: false
    }

    component.bootForm.get('selectedBootParam')?.setValue(selectedBootParam)
    component.bootForm.get('enforceSecureBoot')?.setValue(false)
    fixture.detectChanges()

    component.onSubmit()
    expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedBootDetails)
  })

  it('should not close dialog on invalid submit', () => {
    component.bootForm.get('selectedBootParam')?.setValue(null)
    component.bootForm.get('enforceSecureBoot')?.setValue(true)

    component.onSubmit()
    expect(dialogRefSpy.close).not.toHaveBeenCalled()
  })

  it('should not close dialog when selectedBootParam is null even if form appears valid', () => {
    // This test ensures that even if the form validation passes somehow,
    // the component still checks for a valid selectedBootParam
    const selectedBootParamControl = component.bootForm.get('selectedBootParam')
    selectedBootParamControl?.setValue(null)
    selectedBootParamControl?.clearValidators() // Remove required validator to simulate edge case
    selectedBootParamControl?.updateValueAndValidity()

    component.onSubmit()
    expect(dialogRefSpy.close).not.toHaveBeenCalled()
  })
})
