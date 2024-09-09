import { ComponentFixture, TestBed } from '@angular/core/testing'
import { DevicesService } from '../devices.service'
import { CertificatesComponent } from './certificates.component'
import { of } from 'rxjs'

describe('CertificatesComponent', () => {
  let component: CertificatesComponent
  let fixture: ComponentFixture<CertificatesComponent>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

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

  const responseEmpty = {
    ProfileAssociation: [],
    Certificates: {},
    PublicKeys: {}
  }

  beforeEach(async () => {
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', [
      'getCertificates'
    ])
    devicesServiceSpy.getCertificates.and.returnValue(of(response))

    await TestBed.configureTestingModule({
      imports: [CertificatesComponent],
      providers: [
        { provide: DevicesService, useValue: devicesServiceSpy }]
    }).compileComponents()

    fixture = TestBed.createComponent(CertificatesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('certIsEmpty should return false', () => {
    component.certInfo = response
    expect(component.isCertEmpty()).toBe(false)
  })

  it('certIsEmpty should return true', () => {
    component.certInfo = responseEmpty
    expect(component.isCertEmpty()).toBe(true)
  })
})
