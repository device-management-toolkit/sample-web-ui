/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddCertDialogComponent } from './add-cert-dialog.component'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from '../../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('AddCertDialogComponent', () => {
  let component: AddCertDialogComponent
  let fixture: ComponentFixture<AddCertDialogComponent>
  let mockDialogRef: SpyObj<MatDialogRef<AddCertDialogComponent>>
  let mockDevicesService: SpyObj<DevicesService>
  let translate: TranslateService

  beforeEach(() => {
    mockDialogRef = createSpyObj('MatDialogRef', ['close'])
    mockDevicesService = createSpyObj('DevicesService', ['addCertificate'])
    mockDevicesService.addCertificate.mockReturnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        AddCertDialogComponent,
        NoopAnimationsModule,
        FormsModule,
        MatCheckboxModule
      ],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { deviceId: '123' } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    fixture = TestBed.createComponent(AddCertDialogComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with isTrustedRoot set to false', () => {
    expect(component.certInfo.isTrusted).toBe(false)
  })

  it('should close dialog when onCancel is called', () => {
    component.onCancel()
    expect(mockDialogRef.close).toHaveBeenCalled()
  })

  it('should handle file selection correctly', () => {
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      readAsText: vi.fn(),
      onload: null as any,
      result: 'data:text/plain;base64,SGVsbG8gV29ybGQ='
    }
    vi.spyOn(window, 'FileReader').mockImplementation(function () {
      return mockFileReader as unknown as FileReader
    } as any)

    const mockFile = new File(['dummy content'], 'test.cer', { type: 'application/x-x509-ca-cert' })
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as unknown as Event

    component.onFileSelected(mockEvent)
    expect(mockFileReader.readAsDataURL).toHaveBeenCalled()

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as unknown as ProgressEvent<FileReader>)
    }

    expect(component.certInfo.cert).toBe('SGVsbG8gV29ybGQ=')
  })

  it('should parse PEM files by stripping headers and whitespace', () => {
    const pemText = '-----BEGIN CERTIFICATE-----\nSGVsbG8g\nV29ybGQ=\n-----END CERTIFICATE-----\n'
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      readAsText: vi.fn(),
      onload: null as any,
      result: pemText
    }
    vi.spyOn(window, 'FileReader').mockImplementation(function () {
      return mockFileReader as unknown as FileReader
    } as any)

    const mockFile = new File([pemText], 'test.pem', { type: 'application/x-pem-file' })
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as unknown as Event

    component.onFileSelected(mockEvent)
    expect(mockFileReader.readAsText).toHaveBeenCalled()
    expect(mockFileReader.readAsDataURL).not.toHaveBeenCalled()

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as unknown as ProgressEvent<FileReader>)
    }

    expect(component.certInfo.cert).toBe('SGVsbG8gV29ybGQ=')
  })

  it('should toggle isTrustedRoot when checkbox is clicked', () => {
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input')

    expect(component.certInfo.isTrusted).toBe(false)

    checkbox.click()
    fixture.detectChanges()

    expect(component.certInfo.isTrusted).toBe(true)

    checkbox.click()
    fixture.detectChanges()

    expect(component.certInfo.isTrusted).toBe(false)
  })
})
