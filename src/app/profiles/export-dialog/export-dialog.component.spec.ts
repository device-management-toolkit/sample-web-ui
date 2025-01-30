import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ExportDialogComponent } from './export-dialog.component'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DomainsService } from 'src/app/domains/domains.service'
import { of } from 'rxjs'
import { Domain } from 'src/models/models'

describe('ExportDialogComponent', () => {
  let component: ExportDialogComponent
  let fixture: ComponentFixture<ExportDialogComponent>
  let domainsServiceSpy: jasmine.SpyObj<DomainsService>

  beforeEach(async () => {
    // Create spy for DomainsService
    domainsServiceSpy = jasmine.createSpyObj('DomainsService', ['getData'])
    domainsServiceSpy.getData.and.returnValue(
      of({
        data: [
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
        ],
        totalCount: 2
      })
    )

    await TestBed.configureTestingModule({
      imports: [
        ExportDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: DomainsService, useValue: domainsServiceSpy }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ExportDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should load domains on init', () => {
    expect(domainsServiceSpy.getData).toHaveBeenCalled()
    expect(component.domains.length).toBe(2)
  })

  it('should update selectedDomain on selection change', () => {
    const testValue = 'profile1'
    component.onSelectionChange({ value: testValue })
    expect(component.selectedDomain).toBe(testValue)
  })

  it('should close dialog on cancel', () => {
    const dialogRefSpy = TestBed.inject(MatDialogRef)
    spyOn(dialogRefSpy, 'close')

    component.onCancel()
    expect(dialogRefSpy.close).toHaveBeenCalled()
  })
})
