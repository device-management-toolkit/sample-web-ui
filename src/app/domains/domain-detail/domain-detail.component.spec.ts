/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { DomainsService } from '../domains.service'

import { DomainDetailComponent } from './domain-detail.component'

describe('DomainDetailComponent', () => {
  let component: DomainDetailComponent
  let fixture: ComponentFixture<DomainDetailComponent>
  let getRecordSpy: jasmine.Spy
  let updateRecordSpy: jasmine.Spy
  let createRecordSpy: jasmine.Spy

  beforeEach(async () => {
    const domainsService = jasmine.createSpyObj('DomainsService', ['getRecord', 'update', 'create'])
    getRecordSpy = domainsService.getRecord.and.returnValue(of({ profileName: 'domain' }))
    updateRecordSpy = domainsService.update.and.returnValue(of({}))
    createRecordSpy = domainsService.create.and.returnValue(of({}))
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [DomainDetailComponent],
      providers: [
        { provide: DomainsService, useValue: domainsService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ name: 'name' }) }
        }]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
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
    const event = {
      target: {
        files: [new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })]
      }
    }
    component.onFileSelected(event)
    fixture.detectChanges()
    expect(component.domainForm.controls.provisioningCert).toBeTruthy()
  })
})
