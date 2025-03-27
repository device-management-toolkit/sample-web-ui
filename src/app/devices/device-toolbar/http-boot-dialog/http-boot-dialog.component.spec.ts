/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { HTTPBootDialogComponent } from '././http-boot-dialog.component'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { ReactiveFormsModule } from '@angular/forms'
import { DebugElement } from '@angular/core'
import { By } from '@angular/platform-browser'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('HTTPBootDialogComponent', () => {
  let component: HTTPBootDialogComponent
  let fixture: ComponentFixture<HTTPBootDialogComponent>
  let debugElement: DebugElement
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<HTTPBootDialogComponent>>
  let translate: TranslateService

  // Factory function for the TranslateHttpLoader
  function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json')
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close'])

    await TestBed.configureTestingModule({
      imports: [
        HTTPBootDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(HTTPBootDialogComponent)
    component = fixture.componentInstance
    debugElement = fixture.debugElement
    translate = TestBed.inject(TranslateService)
    translate.setDefaultLang('en')
    fixture.detectChanges()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form with required validators', () => {
    expect(component.bootForm).toBeDefined()

    const urlControl = component.bootForm.get('url')
    urlControl?.setValue('')
    expect(urlControl?.valid).toBeFalsy()
    expect(urlControl?.hasError('required')).toBeTruthy()

    const usernameControl = component.bootForm.get('username')
    usernameControl?.setValue('')
    expect(usernameControl?.valid).toBeTruthy()

    const passwordControl = component.bootForm.get('password')
    passwordControl?.setValue('')
    expect(passwordControl?.valid).toBeTruthy()

    const secureBootControl = component.bootForm.get('enforceSecureBoot')
    expect(secureBootControl?.valid).toBeTruthy()
  })

  it('should initialize form with default values', () => {
    expect(component.bootForm.get('url')?.value).toBe('')
    expect(component.bootForm.get('username')?.value).toBe('')
    expect(component.bootForm.get('password')?.value).toBe('')
    expect(component.bootForm.get('enforceSecureBoot')?.value).toBe(true)
  })

  it('should mark form as invalid when URL is empty', () => {
    const urlControl = component.bootForm.get('url')
    urlControl?.setValue('')
    expect(urlControl?.valid).toBeFalsy()
    expect(urlControl?.hasError('required')).toBeTruthy()
    expect(component.bootForm.valid).toBeFalsy()
  })

  it('should mark form as valid when URL is provided and no username', () => {
    const urlControl = component.bootForm.get('url')
    urlControl?.setValue('https://example.com')
    fixture.detectChanges()

    expect(urlControl?.valid).toBeTruthy()
    expect(component.bootForm.valid).toBeTruthy()
  })

  it('should add required validator to password when username is provided', () => {
    const usernameControl = component.bootForm.get('username')
    const passwordControl = component.bootForm.get('password')

    component.bootForm.get('url')?.setValue('https://example.com')
    usernameControl?.setValue('testuser')
    fixture.detectChanges()

    expect(passwordControl?.validator).toBeTruthy()
    expect(component.bootForm.valid).toBeFalsy()
  })

  it('should mark form as valid when URL, username and password are provided', () => {
    component.bootForm.patchValue({
      url: 'https://example.com',
      username: 'testuser',
      password: 'password123'
    })
    fixture.detectChanges()

    expect(component.bootForm.valid).toBeTruthy()
  })

  it('should clear password required validator when username is cleared', () => {
    const usernameControl = component.bootForm.get('username')
    const passwordControl = component.bootForm.get('password')

    component.bootForm.patchValue({
      url: 'https://example.com',
      username: 'testuser',
      password: ''
    })
    fixture.detectChanges()

    expect(component.bootForm.valid).toBeFalsy()

    usernameControl?.setValue('')
    fixture.detectChanges()

    expect(passwordControl?.validator).toBeFalsy()
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
    component.bootForm.patchValue({
      url: 'https://example.com'
    })
    fixture.detectChanges()

    const okButton = debugElement.query(By.css('button[color="primary"]'))
    expect(okButton.nativeElement.disabled).toBeFalsy()
  })

  it('should call onSubmit and close dialog with form values when OK button is clicked', () => {
    const expectedValue = {
      url: 'https://example.com',
      username: 'testuser',
      password: 'password123',
      enforceSecureBoot: true
    }

    component.bootForm.patchValue(expectedValue)
    fixture.detectChanges()

    component.onSubmit()
    expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedValue)
  })

  it('should toggle password visibility when visibility button is clicked', () => {
    expect(component.hidePassword).toBeTruthy()

    const visibilityButton = debugElement.query(By.css('button[type="button"]'))
    visibilityButton.nativeElement.click()

    expect(component.hidePassword).toBeFalsy()

    visibilityButton.nativeElement.click()
    expect(component.hidePassword).toBeTruthy()
  })

  it('should verify password input type changes based on hidePassword value', () => {
    const passwordInput = debugElement.query(By.css('input[formControlName="password"]'))

    expect(passwordInput.nativeElement.type).toBe('password')

    component.hidePassword = false
    fixture.detectChanges()

    expect(passwordInput.nativeElement.type).toBe('text')
  })
})
