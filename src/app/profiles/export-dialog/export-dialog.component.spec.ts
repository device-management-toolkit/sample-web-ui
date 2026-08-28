/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { of, throwError, Subject } from 'rxjs'
import { Router } from '@angular/router'
import { ExportDialogComponent } from './export-dialog.component'
import { DomainsService } from '../../domains/domains.service'
import { type Domain } from '../../../models/models'
import { provideTranslateService } from '@ngx-translate/core'

describe('ExportDialogComponent', () => {
  let component: ExportDialogComponent
  let fixture: ComponentFixture<ExportDialogComponent>
  let domainsServiceSpy: SpyObj<DomainsService>
  let dialogRefSpy: SpyObj<MatDialogRef<ExportDialogComponent>>
  let routerSpy: SpyObj<Router>

  const mockDomains: Domain[] = [
    {
      profileName: 'profile1',
      domainSuffix: 'example.com',
      provisioningCert: 'cert1',
      provisioningCertPassword: 'pass1',
      provisioningCertStorageFormat: 'PEM',
      expirationDate: new Date('2025-01-15')
    },
    {
      profileName: 'profile2',
      domainSuffix: 'test.com',
      provisioningCert: 'cert2',
      provisioningCertPassword: 'pass2',
      provisioningCertStorageFormat: 'PEM',
      expirationDate: new Date('2025-01-15')
    }
  ]

  beforeEach(() => {
    // Create spies for services
    domainsServiceSpy = createSpyObj('DomainsService', ['getData'])
    dialogRefSpy = createSpyObj('MatDialogRef', ['close'])
    routerSpy = createSpyObj('Router', ['navigate'])

    domainsServiceSpy.getData.mockReturnValue(
      of({
        data: mockDomains,
        totalCount: 2
      })
    )

    TestBed.configureTestingModule({
      imports: [
        ExportDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: DomainsService, useValue: domainsServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })

    fixture = TestBed.createComponent(ExportDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should load domains on init', () => {
    expect(domainsServiceSpy.getData).toHaveBeenCalled()
    expect(component.domains().length).toBe(2)
    expect(component.isLoading()).toBe(false)
  })

  it('should set default selected domain when domains are loaded', () => {
    expect(component.selectedDomainControl.value).toBe('profile1')
    expect(component.selectedDomain()).toBe('profile1')
  })

  it('should update form validity based on selection', () => {
    // Initially, the form should be valid because a default domain is set
    expect(component.selectedDomainControl.value).toBe('profile1')
    expect(component.isFormValid()).toBe(true)

    // Clear domains first to prevent effect from resetting the value
    component.domains.set([])
    fixture.detectChanges()

    // Now set to null to make it invalid
    component.selectedDomainControl.setValue(null)
    fixture.detectChanges()

    // Check individual conditions
    expect(component.selectedDomainControl.value).toBeNull()
    expect(component.selectedDomainControl.valid).toBe(false)

    // Now the computed should be false
    expect(component.isFormValid()).toBe(false)

    // Set a valid value
    component.selectedDomainControl.setValue('profile2')
    fixture.detectChanges()
    expect(component.selectedDomainControl.value).toBe('profile2')
    expect(component.selectedDomainControl.valid).toBe(true)
    expect(component.isFormValid()).toBe(true)
  })

  it('should close dialog on cancel', () => {
    component.onCancel()
    expect(dialogRefSpy.close).toHaveBeenCalled()
  })

  it('should close dialog with selected domain on OK when form is valid', () => {
    dialogRefSpy.close.mockClear() // Reset previous calls
    component.selectedDomainControl.setValue('profile2')
    fixture.detectChanges()
    component.onOk()
    expect(dialogRefSpy.close).toHaveBeenCalledWith('profile2')
  })

  it('should not close dialog on OK when form is invalid', () => {
    dialogRefSpy.close.mockClear() // Reset previous calls

    // Clear domains to prevent effect from resetting the value
    component.domains.set([])
    fixture.detectChanges()

    component.selectedDomainControl.setValue(null)
    fixture.detectChanges()

    // Verify form is invalid
    expect(component.isFormValid()).toBe(false)

    component.onOk()
    expect(dialogRefSpy.close).not.toHaveBeenCalled()
  })

  it('should close dialog with "none" on skip domain', () => {
    component.onSkipDomain()
    expect(dialogRefSpy.close).toHaveBeenCalledWith('none')
  })

  it('should navigate to domains and close dialog', async () => {
    await component.navigateToDomains()
    expect(dialogRefSpy.close).toHaveBeenCalled()
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/domains', 'new'])
  })

  it('should handle error when loading domains', () => {
    // Reset the component
    component.domains.set([])
    component.isLoading.set(false)

    // Setup error response
    const errorMessage = ['Failed to load domains']
    domainsServiceSpy.getData.mockReturnValue(throwError(() => errorMessage))

    component.getDomains()

    expect(component.errorMessages()).toEqual(errorMessage)
    expect(component.isLoading()).toBe(false)
  })

  it('should show loading state when fetching domains', () => {
    // Set up a new spy that doesn't immediately resolve
    const mockSubject = new Subject<any>()
    domainsServiceSpy.getData.mockReturnValue(mockSubject.asObservable())

    // Reset state
    component.isLoading.set(false)

    // Call getDomains to start loading
    component.getDomains()

    // The loading state should be true immediately after calling getDomains
    expect(component.isLoading()).toBe(true)

    // Complete the observable
    mockSubject.next({
      data: mockDomains,
      totalCount: 2
    })
    mockSubject.complete()

    // Should not be loading anymore
    expect(component.isLoading()).toBe(false)
  })

  it('should compute hasNoDomains correctly', () => {
    expect(component.hasNoDomains()).toBe(false)

    component.domains.set([])
    expect(component.hasNoDomains()).toBe(true)
  })
})
