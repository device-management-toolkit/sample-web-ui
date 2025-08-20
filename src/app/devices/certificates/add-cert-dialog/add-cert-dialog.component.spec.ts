import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddCertDialogComponent } from './add-cert-dialog.component'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from '../../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('AddCertDialogComponent', () => {
  let component: AddCertDialogComponent
  let fixture: ComponentFixture<AddCertDialogComponent>
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddCertDialogComponent>>
  let mockDevicesService: jasmine.SpyObj<DevicesService>
  let translate: TranslateService

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close'])
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['addCertificate'])
    mockDevicesService.addCertificate.and.returnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        AddCertDialogComponent,
        NoopAnimationsModule,
        FormsModule,
        MatCheckboxModule,
        TranslateModule.forRoot()
      ],
      providers: [
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
    expect(component.certInfo.isTrusted).toBeFalse()
  })

  it('should close dialog when onCancel is called', () => {
    component.onCancel()
    expect(mockDialogRef.close).toHaveBeenCalled()
  })

  it('should handle file selection correctly', () => {
    const mockFileReader = {
      readAsDataURL: jasmine.createSpy('readAsDataURL'),
      onload: null as any,
      result: 'data:text/plain;base64,SGVsbG8gV29ybGQ='
    }
    spyOn(window, 'FileReader').and.returnValue(mockFileReader as unknown as FileReader)

    const mockFile = new File(['dummy content'], 'test.cer', { type: 'application/x-x509-ca-cert' })
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as unknown as Event

    component.onFileSelected(mockEvent)

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as unknown as ProgressEvent<FileReader>)
    }

    expect(component.certInfo.cert).toBe('SGVsbG8gV29ybGQ=')
  })

  it('should toggle isTrustedRoot when checkbox is clicked', () => {
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input')

    expect(component.certInfo.isTrusted).toBeFalse()

    checkbox.click()
    fixture.detectChanges()

    expect(component.certInfo.isTrusted).toBeTrue()

    checkbox.click()
    fixture.detectChanges()

    expect(component.certInfo.isTrusted).toBeFalse()
  })
})
