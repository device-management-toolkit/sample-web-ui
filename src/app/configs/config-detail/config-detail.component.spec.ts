/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { ConfigsService } from '../configs.service'

import { ConfigDetailComponent } from './config-detail.component'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

describe('ConfigDetailComponent', () => {
  let component: ConfigDetailComponent
  let fixture: ComponentFixture<ConfigDetailComponent>
  let getRecordSpy: jasmine.Spy
  let updateRecordSpy: jasmine.Spy
  let loadMpsRootCertSpy: jasmine.Spy
  let createRecordSpy: jasmine.Spy
  let translate: TranslateService

  // Factory function for the TranslateHttpLoader
  function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json')
  }

  beforeEach(async () => {
    const configsService = jasmine.createSpyObj('ConfigsService', [
      'getRecord',
      'update',
      'loadMPSRootCert',
      'create'
    ])
    getRecordSpy = configsService.getRecord.and.returnValue(of({ serverAddressFormat: 3, configName: 'ciraConfig1' }))
    updateRecordSpy = configsService.update.and.returnValue(of({}))
    loadMpsRootCertSpy = configsService.loadMPSRootCert.and.returnValue(of('root certificate'))
    createRecordSpy = configsService.create.and.returnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ConfigDetailComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      providers: [
        { provide: ConfigsService, useValue: configsService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ name: 'name' }) }
        },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDetailComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setDefaultLang('en')
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getRecordSpy.calls.any()).toBe(true, 'getRecord called')
    expect(component.isEdit).toBeTrue()
    expect(component.pageTitle).toEqual('ciraConfig1')
  })

  it('should cancel', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/ciraconfigs'])
  })

  it('should update the server address format on change', () => {
    component.configForm.get('serverAddressFormat')?.setValue('201')
    component.configForm.get('serverAddressFormat')?.updateValueAndValidity({ emitEvent: true })
    fixture.detectChanges()
    expect(component.configForm.get('commonName')?.value).toEqual(null)
  })

  it('should set the common name same as server address when format is ip address', () => {
    component.configForm.get('mpsServerAddress')?.setValue('255.255.255.1')
    component.configForm.get('mpsServerAddress')?.updateValueAndValidity({ emitEvent: true })

    fixture.detectChanges()
    expect(component.configForm.get('commonName')?.value).toEqual('255.255.255.1')
  })

  it('should submit when valid(update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    component.configForm.patchValue({
      configName: 'ciraConfig1',
      mpsServerAddress: '255.255.255.255',
      serverAddressFormat: '3', // 3 = ip, 201 = FQDN? wtf?
      commonName: '255.255.255.255',
      mpsPort: 4433,
      username: 'admin',
      mpsRootCertificate: 'rootcert',
      proxyDetails: null,
      regeneratePassword: false
    })
    expect(component.configForm.valid).toBeTruthy()

    component.onSubmit()

    expect(component.isLoading).toBeFalse()
    expect(loadMpsRootCertSpy).toHaveBeenCalled()
    expect(updateRecordSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should submit when valid(create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    component.configForm.patchValue({
      configName: 'ciraConfig2',
      mpsServerAddress: '255.255.255.255',
      serverAddressFormat: '3', // 3 = ip, 201 = FQDN? wtf?
      commonName: '255.255.255.255',
      mpsPort: 4433,
      username: 'admin',
      mpsRootCertificate: 'rootcert',
      proxyDetails: null,
      regeneratePassword: false
    })
    component.isEdit = false
    expect(component.configForm.valid).toBeTruthy()

    component.onSubmit()

    expect(component.isLoading).toBeFalse()
    expect(createRecordSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })
})
