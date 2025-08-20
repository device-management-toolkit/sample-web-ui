/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CertificatesComponent } from './certificates.component'
import { DevicesService } from '../devices.service'
import { of } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('CertificatesComponent', () => {
  let component: CertificatesComponent
  let fixture: ComponentFixture<CertificatesComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>
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
      'addCertificate'
    ])
    devicesServiceSpy.getCertificates.and.returnValue(of(response))
    devicesServiceSpy.addCertificate.and.returnValue(of({}))

    TestBed.configureTestingModule({
      imports: [
        CertificatesComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: devicesServiceSpy },
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
    component.certInfo = undefined
    expect(component.isCertEmpty()).toBeTrue()
  })

  it('isCertEmpty should return true when certificates array is empty', () => {
    component.certInfo = { certificates: {} }
    expect(component.isCertEmpty()).toBeTrue()
  })

  it('isCertEmpty should return false when certificates array has items', () => {
    component.certInfo = {
      certificates: {
        '1': { displayName: 'Cert1', x509Certificate: 'cert-data' }
      }
    }
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
})
