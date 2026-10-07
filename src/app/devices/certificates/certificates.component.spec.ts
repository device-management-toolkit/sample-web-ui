/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
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
  let devicesServiceSpy: SpyObj<DevicesService>
  let dialogSpy: SpyObj<MatDialog>
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
    devicesServiceSpy = createSpyObj('DevicesService', [
      'getCertificates',
      'addCertificate',
      'deleteCertificate'
    ])
    devicesServiceSpy.getCertificates.mockReturnValue(of(response))
    devicesServiceSpy.addCertificate.mockReturnValue(of({}))
    devicesServiceSpy.deleteCertificate.mockReturnValue(of({}))

    dialogSpy = createSpyObj('MatDialog', ['open'])

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
    expect(component.isCertEmpty()).toBe(true)
  })

  it('isCertEmpty should return true when certificates array is empty', () => {
    component.certInfo.set({ certificates: {} })
    expect(component.isCertEmpty()).toBe(true)
  })

  it('isCertEmpty should return false when certificates array has items', () => {
    component.certInfo.set({
      certificates: {
        '1': { displayName: 'Cert1', x509Certificate: 'cert-data' }
      }
    })
    expect(component.isCertEmpty()).toBe(false)
  })

  it('should call getCertificates on init', () => {
    expect(devicesServiceSpy.getCertificates).toHaveBeenCalled()
  })

  it('should handle certificate download', () => {
    const mockUrl = 'blob:mock-url'
    const mockAnchor = document.createElement('a')
    const createElement = document.createElement.bind(document)

    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl)
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined)
    // Only intercept the download anchor: every spec file shares this document, and
    // TestBed needs the real createElement to mount component fixtures.
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string, options?: ElementCreationOptions) =>
        tagName === 'a' ? mockAnchor : createElement(tagName, options)) as any)
    const clickSpy = vi.spyOn(mockAnchor, 'click').mockImplementation(() => undefined)

    const cert = {
      displayName: 'TestCert',
      x509Certificate: 'MIIC1TCCAb2gAwIBAgIJAOjOBRLbw3l7MA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV'
    }

    try {
      component.downloadCert(cert)

      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(mockAnchor.download).toBe('TestCert.crt')
      expect(clickSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl)
    } finally {
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    }
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
    dialogSpy.open.mockReturnValue({ afterClosed: () => of(true) } as MatDialogRef<any>)
    devicesServiceSpy.getCertificates.mockClear()

    const target = { instanceID: 'Intel(r) AMT Certificate: Handle: 0', displayName: 'CommonName' }
    component.deleteCertificate(target)

    expect(devicesServiceSpy.deleteCertificate).toHaveBeenCalledWith('', target.instanceID)
    expect(devicesServiceSpy.getCertificates).not.toHaveBeenCalled()
    const items = component.certInfo().certificates.publicKeyCertificateItems
    expect(items.some((c: any) => c.instanceID === target.instanceID)).toBe(false)
    expect(component.isLoading()).toBe(false)
  })

  it('add flow should keep isLoading true until the refresh GET resolves', () => {
    const getResults = new Subject<any>()
    devicesServiceSpy.getCertificates.mockReturnValue(getResults)
    devicesServiceSpy.addCertificate.mockReturnValue(of({}))

    component.addCertificate({ cert: 'abc', isTrusted: false })

    expect(component.isLoading()).toBe(true)

    getResults.next(response)
    getResults.complete()

    expect(component.isLoading()).toBe(false)
    expect(component.certInfo()).toBe(response)
  })
})
