import { TestBed } from '@angular/core/testing'

import { UserConsentService } from './user-consent.service'
import { DevicesService } from './devices.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { UserConsentData, UserConsentResponse } from 'src/models/models'
import { environment } from 'src/environments/environment'
import { TranslateModule } from '@ngx-translate/core'

describe('UserConsentService', () => {
  let service: UserConsentService
  let devicesService: jasmine.SpyObj<DevicesService>
  let dialog: jasmine.SpyObj<MatDialog>
  let snackBar: jasmine.SpyObj<MatSnackBar>
  let reqUserConsentCodeSpy: jasmine.Spy
  let cancelUserConsentCodeSpy: jasmine.Spy
  let userConsentResponse: UserConsentResponse
  let userConsentData: UserConsentData
  let displayErrorSpy: jasmine.Spy

  beforeEach(() => {
    devicesService = jasmine.createSpyObj('DevicesService', ['reqUserConsentCode', 'cancelUserConsentCode'])
    dialog = jasmine.createSpyObj('MatDialog', ['open'])
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open'])
    const reqUserConsentResponse: UserConsentResponse = {} as any
    reqUserConsentCodeSpy = devicesService.reqUserConsentCode.and.returnValue(of(reqUserConsentResponse))
    cancelUserConsentCodeSpy = devicesService.cancelUserConsentCode.and.returnValue(of(reqUserConsentResponse))
    userConsentResponse = {
      Body: { ReturnValue: 0, ReturnValueStr: 'Success' },
      Header: {
        Action: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService/SendOptInCodeResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-0000000001B7',
        RelatesTo: '0',
        ResourceURI: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService',
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous'
      }
    }
    userConsentData = { deviceId: '111', results: userConsentResponse }
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        UserConsentService,
        { provide: DevicesService, useValue: devicesService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar }]
    })
    service = TestBed.inject(UserConsentService)
    displayErrorSpy = spyOn(service, 'displayError').and.callThrough()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
  it('should handle user consent response correctly', (done) => {
    environment.cloud = true
    const mockDialogData: UserConsentData = {
      deviceId: 'test-guid',
      results: userConsentResponse
    }
    dialog.open.and.returnValue({ afterClosed: () => of(mockDialogData) } as any)
    service.handleUserConsentResponse('test-guid', userConsentResponse, 'KVM').subscribe((result) => {
      expect(result).toBeTrue()
      expect(dialog.open).toHaveBeenCalled()
      done()
    })
  })
  it('handleUserConsentDecision false', async () => {
    service.handleUserConsentDecision(false, '111', {
      userConsent: 'all',
      redirection: true,
      kvmAvailable: true,
      KVM: true,
      SOL: true,
      IDER: true,
      optInState: 2,
      ocr: false,
      httpsBootSupported: false,
      winREBootSupported: false,
      localPBABootSupported: false,
      remoteErase: false,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('handleUserConsentResponse false', async () => {
    service.handleUserConsentResponse('111', false, 'KVM')
    expect(displayErrorSpy).toHaveBeenCalled()
  })
  it('should handle SendOptInCodeResponse in cloud environment', () => {
    environment.cloud = true
    const result = service.afterUserConsentDialogClosed(userConsentData, 'KVM')
    expect(result).toBeTrue()
  })
  it('cancelOptInCodeResponse 0', async () => {
    service.cancelOptInCodeResponse(userConsentResponse, 'KVM')
    expect(displayErrorSpy).toHaveBeenCalled()
  })
  it('cancelOptInCodeResponse 1', async () => {
    userConsentResponse.Body = { ReturnValue: 1, ReturnValueStr: 'Success' }
    service.cancelOptInCodeResponse(userConsentResponse, 'KVM')
    expect(displayErrorSpy).toHaveBeenCalled()
  })
  it('sendOptInCodeResponse 0', async () => {
    const result = service.sendOptInCodeResponse(userConsentResponse, 'KVM')
    expect(result).toEqual(true)
  })
  it('sendOptInCodeResponse 2066', async () => {
    userConsentResponse.Body = { ReturnValue: 2066, ReturnValueStr: 'Success' }
    const result = service.sendOptInCodeResponse(userConsentResponse, 'KVM')
    expect(result).toEqual(false)
  })
  it('sendOptInCodeResponse 1', async () => {
    userConsentResponse.Body = { ReturnValue: 1, ReturnValueStr: 'Success' }
    const result = service.sendOptInCodeResponse(userConsentResponse, 'KVM')
    expect(displayErrorSpy).toHaveBeenCalled()
    expect(result).toEqual(false)
  })
  it('reqUserConsentCode ', async () => {
    service.reqUserConsentCode('111')
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('cancelUserConsentCode ', async () => {
    service.cancelUserConsentCode('111', 'KVM')
    expect(cancelUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('should show dialog when called', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: () => of(null) })
    dialog.open.and.returnValue(dialogRefSpyObj)
    service.userConsentDialog('111')
    expect(dialog.open).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
  })
})
