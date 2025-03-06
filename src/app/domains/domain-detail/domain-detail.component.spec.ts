/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { DomainsService } from '../domains.service'

import { DomainDetailComponent } from './domain-detail.component'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('DomainDetailComponent', () => {
  let component: DomainDetailComponent
  let fixture: ComponentFixture<DomainDetailComponent>
  let getRecordSpy: jasmine.Spy
  let updateRecordSpy: jasmine.Spy
  let createRecordSpy: jasmine.Spy
  let translate: TranslateService

  // Factory function for the TranslateHttpLoader
  function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json')
  }

  beforeEach(async () => {
    const domainsService = jasmine.createSpyObj('DomainsService', [
      'getRecord',
      'update',
      'create'
    ])
    getRecordSpy = domainsService.getRecord.and.returnValue(of({ profileName: 'domain' }))
    updateRecordSpy = domainsService.update.and.returnValue(of({}))
    createRecordSpy = domainsService.create.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DomainDetailComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      providers: [
        { provide: DomainsService, useValue: domainsService },
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
    fixture = TestBed.createComponent(DomainDetailComponent)
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
    expect(component.isLoading).toBeFalse()
    expect(component.isEdit).toBeTrue()
    expect(component.pageTitle).toEqual('domain')
  })

  it('should cancel', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/domains'])
  })

  it('should submit when valid(update)', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    component.domainForm.patchValue({
      profileName: 'domain1',
      domainSuffix: 'domain.com',
      provisioningCert: 'domainCert',
      provisioningCertPassword: 'P@ssw0rd'
    })

    expect(component.domainForm.valid).toBeTruthy()
    component.onSubmit()

    expect(updateRecordSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should submit when form is valid(create)', () => {
    const routerSpy = spyOn(component.router, 'navigate')
    component.domainForm.patchValue({
      profileName: 'domain1',
      domainSuffix: 'domain.com',
      provisioningCert: 'domainCert',
      provisioningCertPassword: 'P@ssw0rd'
    })
    component.isEdit = false
    expect(component.domainForm.valid).toBeTruthy()
    component.onSubmit()

    expect(createRecordSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should attach the domain certificate on file selected', () => {
    component.domainForm.patchValue({
      profileName: 'domain1',
      domainSuffix: 'domain.com',
      provisioningCertPassword: 'P@ssw0rd'
    })
    const obj = {
      data: 'application/x-pkcs12;base64;domaincertdata'
    }
    const event: Event = {
      target: {
        files: [new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })]
      }
    } as any
    component.onFileSelected(event)
    fixture.detectChanges()
    expect(component.domainForm.controls.provisioningCert).toBeTruthy()
  })

  it('should turn cert pass visibility on when it is off', () => {
    component.certPassInputType = 'password'
    component.toggleCertPassVisibility()

    expect(component.certPassInputType).toEqual('text')
  })

  it('should turn cert pass visibility off when it is on', () => {
    component.certPassInputType = 'text'
    component.toggleCertPassVisibility()

    expect(component.certPassInputType).toEqual('password')
  })
})
