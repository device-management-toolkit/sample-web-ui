/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CertificatesComponent } from './certificates.component'
import { DevicesService } from '../devices.service'
import { of, Subject } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'

describe('CertificatesComponent', () => {
  let component: CertificatesComponent
  let fixture: ComponentFixture<CertificatesComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
  let dialogSpy: jasmine.SpyObj<MatDialog>
  let translate: TranslateService

  const response = {
    profileAssociation: [
      {
        type: 'TLS',
        profileID: 'TestID',
        clientCertificate: {
          elementName: 'Intel(r) AMT Certificate',
          instanceID: 'Intel(r) AMT Certificate: Handle: 0',
          x509Certificate: 'cert',
          trustedRootCertificate: false,
          issuer: 'C=US,S=California,L=Santa Clara,O=Intel Corporation,CN=CommonName',
          subject: 'C=US,S=California,L=Santa Clara,O=Intel Corporation,CN=CommonName',
          readOnlyCertificate: true,
          publicKeyHandle: 'Intel(r) AMT Key: Handle: 0',
          associatedProfiles: [
            'TLS'
          ],
          displayName: 'CommonName'
        },
        publicKey: {
          elementName: 'Intel(r) AMT Key',
          instanceID: 'Intel(r) AMT Key: Handle: 0',
          derKey: 'key'
        }
      },
      {
        type: 'Wireless',
        profileID: 'exampleWifi8021x',
        rootCertificate: {
          elementName: 'Intel(r) AMT Certificate',
          instanceID: 'Intel(r) AMT Certificate: Handle: 2',
          x509Certificate: 'cert',
          trustedRootCertificate: true,
          issuer: 'C=US,S=AZ,O=Intc',
          subject: 'C=US,S=AZ,O=Intc',
          readOnlyCertificate: false,
          associatedProfiles: [
            'Wireless - exampleWifi8021x'
          ],
          displayName: 'Intel(r) AMT Certificate: Handle: 2'
        },
        clientCertificate: {
          elementName: 'Intel(r) AMT Certificate',
          instanceID: 'Intel(r) AMT Certificate: Handle: 1',
          x509Certificate: 'cert',
          trustedRootCertificate: false,
          issuer: 'C=US,S=AZ,O=Intc',
          subject: 'C=US,S=AZ,O=Intc',
          readOnlyCertificate: false,
          publicKeyHandle: 'Intel(r) AMT Key: Handle: 1',
          associatedProfiles: [
            'Wireless - exampleWifi8021x'
          ],
          displayName: 'Intel(r) AMT Certificate: Handle: 1'
        },
        publicKey: {
          elementName: 'Intel(r) AMT Key',
          instanceID: 'Intel(r) AMT Key: Handle: 1',
          derKey: 'key'
        }
      }
    ],
    certificates: {
      publicKeyCertificateItems: [
        {
          elementName: 'Intel(r) AMT Certificate',
          instanceID: 'Intel(r) AMT Certificate: Handle: 0',
          x509Certificate: 'cert',
          trustedRootCertificate: false,
          issuer: 'C=US,S=California,L=Santa Clara,O=Intel Corporation,CN=CommonName',
          subject: 'C=US,S=California,L=Santa Clara,O=Intel Corporation,CN=CommonName',
          readOnlyCertificate: true,
          publicKeyHandle: 'Intel(r) AMT Key: Handle: 0',
          associatedProfiles: [
            'TLS'
          ],
          displayName: 'CommonName'
        },
        {
          elementName: 'Intel(r) AMT Certificate',
          instanceID: 'Intel(r) AMT Certificate: Handle: 1',
          x509Certificate: 'cert',
          trustedRootCertificate: false,
          issuer: 'C=US,S=AZ,O=Intc',
          subject: 'C=US,S=AZ,O=Intc',
          readOnlyCertificate: false,
          publicKeyHandle: 'Intel(r) AMT Key: Handle: 1',
          associatedProfiles: [
            'Wireless - exampleWifi8021x'
          ],
          displayName: 'Intel(r) AMT Certificate: Handle: 1'
        },
        {
          elementName: 'Intel(r) AMT Certificate',
          instanceID: 'Intel(r) AMT Certificate: Handle: 2',
          x509Certificate: 'cert',
          trustedRootCertificate: true,
          issuer: 'C=US,S=AZ,O=Intc',
          subject: 'C=US,S=AZ,O=Intc',
          readOnlyCertificate: false,
          associatedProfiles: [
            'Wireless - exampleWifi8021x'
          ],
          displayName: 'Intel(r) AMT Certificate: Handle: 2'
        }
      ]
    },
    publicKeys: {
      publicPrivateKeyPairItems: [
        {
          elementName: 'Intel(r) AMT Key',
          instanceID: 'Intel(r) AMT Key: Handle: 0',
          derKey: 'key',
          certificateHandle: 'Intel(r) AMT Certificate: Handle: 0'
        },
        {
          elementName: 'Intel(r) AMT Key',
          instanceID: 'Intel(r) AMT Key: Handle: 1',
          derKey: 'key',
          certificateHandle: 'Intel(r) AMT Certificate: Handle: 1'
        }
      ]
    }
  }

  beforeEach(() => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getCertificates',
      'addCertificate',
      'deleteCertificate'
    ])
    devicesServiceSpy.getCertificates.and.returnValue(of(response))
    devicesServiceSpy.addCertificate.and.returnValue(of({}))
    devicesServiceSpy.deleteCertificate.and.returnValue(of({}))

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])

    TestBed.configureTestingModule({
      imports: [
        CertificatesComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })

    fixture = TestBed.createComponent(CertificatesComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('isCertEmpty should return true when certificates are undefined', () => {
    component.certInfo.set(undefined)
    expect(component.isCertEmpty()).toBeTrue()
  })

  it('isCertEmpty should return true when certificates array is empty', () => {
    component.certInfo.set({ certificates: {} })
    expect(component.isCertEmpty()).toBeTrue()
  })

  it('isCertEmpty should return false when certificates array has items', () => {
    component.certInfo.set({
      certificates: {
        '1': { displayName: 'Cert1', x509Certificate: 'cert-data' }
      }
    })
    expect(component.isCertEmpty()).toBeFalse()
  })

  it('should call getCertificates on init', () => {
    expect(devicesServiceSpy.getCertificates).toHaveBeenCalled()
  })

  it('should handle certificate download', () => {
    const mockUrl = 'blob:mock-url'
    const mockAnchor = document.createElement('a')

    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl)
    spyOn(window.URL, 'revokeObjectURL')
    spyOn(document, 'createElement').and.returnValue(mockAnchor)
    spyOn(document.body, 'appendChild')
    spyOn(document.body, 'removeChild')
    spyOn(mockAnchor, 'click')

    const cert = {
      displayName: 'TestCert',
      x509Certificate: 'MIIC1TCCAb2gAwIBAgIJAOjOBRLbw3l7MA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV'
    }

    component.downloadCert(cert)

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(mockAnchor.download).toBe('TestCert.crt')
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
  })

  it('removeCertLocally should drop the matching item from the signal', () => {
    component.certInfo.set({
      certificates: {
        publicKeyCertificateItems: [
          { instanceID: 'a', displayName: 'A' },
          { instanceID: 'b', displayName: 'B' }
        ]
      }
    })

    component.removeCertLocally('a')

    const items = component.certInfo().certificates.publicKeyCertificateItems
    expect(items.length).toBe(1)
    expect(items[0].instanceID).toBe('b')
  })

  it('removeCertLocally should no-op when there is no list', () => {
    component.certInfo.set(undefined)
    expect(() => component.removeCertLocally('a')).not.toThrow()
    expect(component.certInfo()).toBeUndefined()
  })

  it('delete success should optimistically remove the cert without refetching', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>)
    devicesServiceSpy.getCertificates.calls.reset()

    const target = { instanceID: 'Intel(r) AMT Certificate: Handle: 0', displayName: 'CommonName' }
    component.deleteCertificate(target)

    expect(devicesServiceSpy.deleteCertificate).toHaveBeenCalledWith('', target.instanceID)
    expect(devicesServiceSpy.getCertificates).not.toHaveBeenCalled()
    const items = component.certInfo().certificates.publicKeyCertificateItems
    expect(items.some((c: any) => c.instanceID === target.instanceID)).toBeFalse()
    expect(component.isLoading()).toBeFalse()
  })

  it('add flow should keep isLoading true until the refresh GET resolves', () => {
    const getResults = new Subject<any>()
    devicesServiceSpy.getCertificates.and.returnValue(getResults)
    devicesServiceSpy.addCertificate.and.returnValue(of({}))

    component.addCertificate({ cert: 'abc', isTrusted: false })

    expect(component.isLoading()).toBeTrue()

    getResults.next(response)
    getResults.complete()

    expect(component.isLoading()).toBeFalse()
    expect(component.certInfo()).toBe(response)
  })
})
