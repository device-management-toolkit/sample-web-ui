/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { DomainsService } from '../domains.service'

import { DomainDetailComponent } from './domain-detail.component'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('DomainDetailComponent', () => {
  let component: DomainDetailComponent
  let fixture: ComponentFixture<DomainDetailComponent>
  let getRecordSpy: MockInstance
  let updateRecordSpy: MockInstance
  let createRecordSpy: MockInstance
  let translate: TranslateService

  beforeEach(() => {
    const domainsService = createSpyObj('DomainsService', [
      'getRecord',
      'update',
      'create'
    ])
    getRecordSpy = domainsService.getRecord.mockReturnValue(of({ profileName: 'domain' }))
    updateRecordSpy = domainsService.update.mockReturnValue(of({}))
    createRecordSpy = domainsService.create.mockReturnValue(of({}))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DomainDetailComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DomainsService, useValue: domainsService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ name: 'name' }) }
        },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainDetailComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getRecordSpy.mock.calls.length > 0, 'getRecord called').toBe(true)
    expect(component.isLoading()).toBe(false)
    expect(component.isEdit).toBe(true)
    expect(component.pageTitle).toEqual('domain')
  })

  it('should cancel', async () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/domains'])
  })

  it('should submit when valid(update)', () => {
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
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
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
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
