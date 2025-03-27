import { ComponentFixture, TestBed } from '@angular/core/testing'
import { AddCertDialogComponent } from './add-cert-dialog.component'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DevicesService } from '../../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('AddCertDialogComponent', () => {
  let component: AddCertDialogComponent
  let fixture: ComponentFixture<AddCertDialogComponent>
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddCertDialogComponent>>
  let mockDevicesService: jasmine.SpyObj<DevicesService>
  let translate: TranslateService

  // Factory function for the TranslateHttpLoader
  function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json')
  }

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close'])
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['addCertificate'])
    mockDevicesService.addCertificate.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [
        AddCertDialogComponent,
        NoopAnimationsModule,
        FormsModule,
        MatCheckboxModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { deviceId: '123' } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DevicesService, useValue: mockDevicesService },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AddCertDialogComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setDefaultLang('en')
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
