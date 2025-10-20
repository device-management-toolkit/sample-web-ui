import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { of, throwError, Subject } from 'rxjs'
import { Router } from '@angular/router'
import { ExportDialogComponent } from './export-dialog.component'
import { DomainsService } from 'src/app/domains/domains.service'
import { type Domain } from 'src/models/models'
import { TranslateModule } from '@ngx-translate/core'

describe('ExportDialogComponent', () => {
  let component: ExportDialogComponent
  let fixture: ComponentFixture<ExportDialogComponent>
  let domainsServiceSpy: jasmine.SpyObj<DomainsService>
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ExportDialogComponent>>
  let routerSpy: jasmine.SpyObj<Router>

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
    domainsServiceSpy = jasmine.createSpyObj('DomainsService', ['getData'])
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close'])
    routerSpy = jasmine.createSpyObj('Router', ['navigate'])

    domainsServiceSpy.getData.and.returnValue(
      of({
        data: mockDomains,
        totalCount: 2
      })
    )

    TestBed.configureTestingModule({
      imports: [
        ExportDialogComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
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
    expect(component.isLoading()).toBeFalse()
  })

  it('should set default selected domain when domains are loaded', () => {
    expect(component.selectedDomainControl.value).toBe('profile1')
    expect(component.selectedDomain()).toBe('profile1')
  })

  it('should update form validity based on selection', () => {
    // Initially, the form should be valid because a default domain is set
    expect(component.selectedDomainControl.value).toBe('profile1')
    expect(component.isFormValid()).toBeTrue()

    // Clear domains first to prevent effect from resetting the value
    component.domains.set([])
    fixture.detectChanges()

    // Now set to null to make it invalid
    component.selectedDomainControl.setValue(null)
    fixture.detectChanges()

    // Check individual conditions
    expect(component.selectedDomainControl.value).toBeNull()
    expect(component.selectedDomainControl.valid).toBeFalse()

    // Now the computed should be false
    expect(component.isFormValid()).toBeFalse()

    // Set a valid value
    component.selectedDomainControl.setValue('profile2')
    fixture.detectChanges()
    expect(component.selectedDomainControl.value).toBe('profile2')
    expect(component.selectedDomainControl.valid).toBeTrue()
    expect(component.isFormValid()).toBeTrue()
  })

  it('should close dialog on cancel', () => {
    component.onCancel()
    expect(dialogRefSpy.close).toHaveBeenCalled()
  })

  it('should close dialog with selected domain on OK when form is valid', () => {
    dialogRefSpy.close.calls.reset() // Reset previous calls
    component.selectedDomainControl.setValue('profile2')
    fixture.detectChanges()
    component.onOk()
    expect(dialogRefSpy.close).toHaveBeenCalledWith('profile2')
  })

  it('should not close dialog on OK when form is invalid', () => {
    dialogRefSpy.close.calls.reset() // Reset previous calls

    // Clear domains to prevent effect from resetting the value
    component.domains.set([])
    fixture.detectChanges()

    component.selectedDomainControl.setValue(null)
    fixture.detectChanges()

    // Verify form is invalid
    expect(component.isFormValid()).toBeFalse()

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
    domainsServiceSpy.getData.and.returnValue(throwError(() => errorMessage))

    component.getDomains()

    expect(component.errorMessages()).toEqual(errorMessage)
    expect(component.isLoading()).toBeFalse()
  })

  it('should show loading state when fetching domains', () => {
    // Set up a new spy that doesn't immediately resolve
    const mockSubject = new Subject<any>()
    domainsServiceSpy.getData.and.returnValue(mockSubject.asObservable())

    // Reset state
    component.isLoading.set(false)

    // Call getDomains to start loading
    component.getDomains()

    // The loading state should be true immediately after calling getDomains
    expect(component.isLoading()).toBeTrue()

    // Complete the observable
    mockSubject.next({
      data: mockDomains,
      totalCount: 2
    })
    mockSubject.complete()

    // Should not be loading anymore
    expect(component.isLoading()).toBeFalse()
  })

  it('should compute hasNoDomains correctly', () => {
    expect(component.hasNoDomains()).toBeFalse()

    component.domains.set([])
    expect(component.hasNoDomains()).toBeTrue()
  })
})
