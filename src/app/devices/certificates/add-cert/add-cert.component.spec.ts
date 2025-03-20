import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddCertComponent } from './add-cert.component'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from '../../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'

describe('AddCertComponent', () => {
  let component: AddCertComponent
  let fixture: ComponentFixture<AddCertComponent>
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddCertComponent>>
  let mockDevicesService: jasmine.SpyObj<DevicesService>

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close'])
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['addCertificate'])
    mockDevicesService.addCertificate.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [
        AddCertComponent,
        NoopAnimationsModule,
        FormsModule,
        MatCheckboxModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { deviceId: '123' } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DevicesService, useValue: mockDevicesService }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AddCertComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with isTrustedRoot set to false', () => {
    expect(component.certInfo.isTrustedRoot).toBeFalse()
  })

  it('should close dialog when onCancel is called', () => {
    component.onCancel()
    expect(mockDialogRef.close).toHaveBeenCalled()
  })

  it('should handle file selection correctly', () => {
    // Setup a mock FileReader
    const mockFileReader = {
      readAsDataURL: jasmine.createSpy('readAsDataURL'),
      onload: null as any,
      result: 'data:text/plain;base64,SGVsbG8gV29ybGQ='
    }
    spyOn(window, 'FileReader').and.returnValue(mockFileReader as unknown as FileReader)

    // Create a mock file and event
    const mockFile = new File(['dummy content'], 'test.cer', { type: 'application/x-x509-ca-cert' })
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as unknown as Event

    // Call the method
    component.onFileSelected(mockEvent)

    // Trigger the onload callback
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as unknown as ProgressEvent<FileReader>)
    }

    // Verify that the cert was updated
    expect(component.certInfo.cert).toBe('SGVsbG8gV29ybGQ=')
  })

  it('should toggle isTrustedRoot when checkbox is clicked', () => {
    // Find the checkbox element
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input')
    
    // Initially false
    expect(component.certInfo.isTrustedRoot).toBeFalse()
    
    // Click the checkbox
    checkbox.click()
    fixture.detectChanges()
    
    // Should now be true
    expect(component.certInfo.isTrustedRoot).toBeTrue()
    
    // Click again
    checkbox.click()
    fixture.detectChanges()
    
    // Should be false again
    expect(component.certInfo.isTrustedRoot).toBeFalse()
  })
})