/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of, throwError } from 'rxjs'
import { ProxyConfigsService } from '../proxy-configs.service'
import { ProxyConfigDetailComponent } from './proxy-config-detail.component'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('ProxyConfigDetailComponent', () => {
  let component: ProxyConfigDetailComponent
  let fixture: ComponentFixture<ProxyConfigDetailComponent>
  let proxyConfigsGetRecordSpy: jasmine.Spy
  let proxyConfigsCreateSpy: jasmine.Spy
  let proxyConfigsUpdateSpy: jasmine.Spy
  let routerSpy: jasmine.Spy
  let translate: TranslateService

  beforeEach(() => {
    const proxyConfigsService = jasmine.createSpyObj('ProxyConfigsService', [
      'getRecord',
      'update',
      'create'
    ])
    proxyConfigsGetRecordSpy = proxyConfigsService.getRecord.and.returnValue(
      of({
        name: 'test-proxy',
        address: '192.168.1.100',
        port: 8080,
        networkDnsSuffix: 'example.com'
      })
    )
    proxyConfigsCreateSpy = proxyConfigsService.create.and.returnValue(of({}))
    proxyConfigsUpdateSpy = proxyConfigsService.update.and.returnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ProxyConfigDetailComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ProxyConfigsService, useValue: proxyConfigsService },
        { provide: ActivatedRoute, useValue: { params: of({ name: 'test-proxy' }) } },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ProxyConfigDetailComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
    routerSpy = spyOn(component.router, 'navigate')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize for edit proxy config', () => {
    expect(component.isEdit).toBe(true) // because we have a 'name' param
    expect(component.pageTitle).toBe('proxyConfigs.pageTitle.editProxy.value')
    expect(proxyConfigsGetRecordSpy).toHaveBeenCalledWith('test-proxy')
  })

  it('should initialize for new proxy config', () => {
    // Create a new component instance with no name param
    const route = TestBed.inject(ActivatedRoute)
    ;(route.params as any) = of({ name: 'new' })

    const newFixture = TestBed.createComponent(ProxyConfigDetailComponent)
    const newComponent = newFixture.componentInstance
    newFixture.detectChanges()

    expect(newComponent.isEdit).toBe(false)
    expect(newComponent.pageTitle).toBe('proxyConfigs.pageTitle.newProxy.value')
  })

  it('should initialize proxy config form', () => {
    expect(component.proxyConfigForm).toBeDefined()
    expect(component.proxyConfigForm.get('name')).toBeTruthy()
    expect(component.proxyConfigForm.get('address')).toBeTruthy()
    expect(component.proxyConfigForm.get('port')).toBeTruthy()
    expect(component.proxyConfigForm.get('networkDnsSuffix')).toBeTruthy()
  })

  it('should validate required fields', () => {
    const form = component.proxyConfigForm
    // Form starts valid because data is loaded from service in ngOnInit
    expect(form.valid).toBeTruthy()

    // Clear all values to test validation
    form.patchValue({
      name: '',
      address: '',
      port: null,
      networkDnsSuffix: ''
    })
    expect(form.valid).toBeFalsy()

    // Fill required fields
    form.patchValue({
      name: 'test',
      address: '192.168.1.1',
      port: 8080,
      networkDnsSuffix: 'example.com'
    })
    expect(form.valid).toBeTruthy()
  })

  it('should create proxy config successfully', () => {
    // Set up for create (not edit)
    const route = TestBed.inject(ActivatedRoute)
    ;(route.params as any) = of({}) // No name param means create

    component.ngOnInit() // Re-initialize
    component.isEdit = false
    component.pageTitle = 'Create Proxy Configuration'

    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.proxyConfigForm.patchValue({
      name: 'new-proxy',
      address: '192.168.1.200',
      port: 3128,
      networkDnsSuffix: 'test.com'
    })

    component.onSubmit()

    expect(proxyConfigsCreateSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalledWith('Profile saved successfully', undefined, jasmine.any(Object))
    expect(routerSpy).toHaveBeenCalledWith(['/proxy-configs'])
  })

  it('should update proxy config successfully', () => {
    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.proxyConfigForm.patchValue({
      name: 'test-proxy',
      address: '192.168.1.101',
      port: 8081,
      networkDnsSuffix: 'updated.com'
    })

    component.onSubmit()

    expect(proxyConfigsUpdateSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalledWith('Profile saved successfully', undefined, jasmine.any(Object))
    expect(routerSpy).toHaveBeenCalledWith(['/proxy-configs'])
  })

  it('should handle create error', () => {
    const errorResponse = {
      error: {
        errors: [{ msg: 'Name already exists' }]
      }
    }
    proxyConfigsCreateSpy.and.returnValue(throwError(() => errorResponse))

    const snackBarSpy = spyOn(component.snackBar, 'open')

    // Set up for create
    component.isEdit = false
    component.proxyConfigForm.patchValue({
      name: 'duplicate-proxy',
      address: '192.168.1.200',
      port: 3128,
      networkDnsSuffix: 'test.com'
    })

    component.onSubmit()

    expect(proxyConfigsCreateSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalledWith('Error saving proxy profile', undefined, jasmine.any(Object))
    expect(component.errorMessages).toEqual(['Name already exists'])
  })

  it('should handle update error with server message', () => {
    const errorResponse = {
      error: {
        message: 'Proxy configuration is in use'
      }
    }
    proxyConfigsUpdateSpy.and.returnValue(throwError(() => errorResponse))

    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.proxyConfigForm.patchValue({
      name: 'test-proxy',
      address: '192.168.1.101',
      port: 8081,
      networkDnsSuffix: 'updated.com'
    })

    component.onSubmit()

    expect(proxyConfigsUpdateSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalledWith('Error saving proxy profile', undefined, jasmine.any(Object))
    expect(component.errorMessages).toEqual(['Proxy configuration is in use'])
  })

  it('should cancel and navigate back', async () => {
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/proxy-configs'])
  })

  it('should not submit if form is invalid', () => {
    const snackBarSpy = spyOn(component.snackBar, 'open')

    // Make form invalid by clearing required fields
    component.proxyConfigForm.patchValue({
      name: '',
      address: '',
      port: null,
      networkDnsSuffix: ''
    })

    component.onSubmit()

    expect(proxyConfigsCreateSpy).not.toHaveBeenCalled()
    expect(proxyConfigsUpdateSpy).not.toHaveBeenCalled()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  it('should return correct error messages for form validation', () => {
    const addressControl = component.proxyConfigForm.get('address')
    addressControl?.markAsTouched()

    // Test required error
    addressControl?.setValue('')
    expect(component.getaddressError()).toBe('Server address is required')
  })
})
