/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, EventEmitter, Input, Output } from '@angular/core'
import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, RouterEvent, Router, RouterModule } from '@angular/router'
import { of, ReplaySubject, Subject, throwError } from 'rxjs'
import { KvmComponent } from './kvm.component'
import { DevicesService } from '../devices.service'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device, userConsentData, userConsentResponse } from 'src/models/models'

describe('KvmComponent', () => {
  let component: KvmComponent
  let fixture: ComponentFixture<KvmComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let getRedirectionStatusSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let sendPowerActionSpy: jasmine.Spy
  let reqUserConsentCodeSpy: jasmine.Spy
  let cancelUserConsentCodeSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy
  let snackBarSpy: jasmine.Spy
  let router: Router
  let userConsentData: userConsentData
  let userConsentResponse: userConsentResponse
  let optInCodeResponseSpy: jasmine.Spy
  let displayErrorSpy: jasmine.Spy
  let devicesService: jasmine.SpyObj<DevicesService>

  const eventSubject = new ReplaySubject<RouterEvent>(1)

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj('DevicesService', [
      'sendPowerAction',
      'getDevice',
      'getPowerState',
      'setAmtFeatures',
      'getAMTFeatures',
      'reqUserConsentCode',
      'cancelUserConsentCode',
      'getRedirectionExpirationToken',
      'getRedirectionStatus'
    ])
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(
      of({ userConsent: 'none', KVM: true, SOL: true, IDER: true, redirection: true, optInState: 0 })
    )
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(
      of({ userConsent: 'none', KVM: true, SOL: true, IDER: true, redirection: true, optInState: 0 })
    )
    devicesService.getDevice.and.returnValue(
      of({
        hostname: 'test-hostname',
        guid: 'test-guid',
        mpsInstance: 'test-mps',
        mpsusername: 'admin',
        tags: [''],
        connectionStatus: true,
        friendlyName: 'test-friendlyName',
        tenantId: '1',
        dnsSuffix: 'dns',
        icon: 0
      })
    )
    getRedirectionStatusSpy = devicesService.getRedirectionStatus.and.returnValue(
      of({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
    )
    const reqUserConsentResponse: userConsentResponse = {} as any
    reqUserConsentCodeSpy = devicesService.reqUserConsentCode.and.returnValue(of(reqUserConsentResponse))
    cancelUserConsentCodeSpy = devicesService.cancelUserConsentCode.and.returnValue(of(reqUserConsentResponse))
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.and.returnValue(of({ token: '123' }))
    devicesService.device = new Subject<Device>()
    devicesService.deviceState = new EventEmitter<number>()
    const websocketStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      connectKVMSocket: new EventEmitter<boolean>(false)
    }
    authServiceStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      startwebSocket: new EventEmitter<boolean>(false)
    }

    @Component({
      selector: 'app-kvm',
      standalone: true,
      imports: []
    })
    class TestAMTKVMComponent {
      @Input()
      deviceId = ''

      @Input()
      mpsServer = ''

      @Input()
      authToken = ''

      @Input()
      deviceConnection = ''

      @Input()
      selectedEncoding = ''

      @Output()
      deviceStatus = new EventEmitter<number>()
    }

    @Component({
      selector: 'app-device-toolbar',
      standalone: true,
      imports: []
    })
    class TestDeviceToolbarComponent {
      @Input()
      isLoading = false

      @Input()
      deviceState = 0
    }

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        KvmComponent,
        TestDeviceToolbarComponent,
        TestAMTKVMComponent
      ],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true }, // trigger automatic change detection
        { provide: DevicesService, useValue: { ...devicesService, ...websocketStub, ...authServiceStub } },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } }
      ]
    }).compileComponents()

    router = TestBed.inject(Router)
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(KvmComponent)
    component = fixture.componentInstance
    snackBarSpy = spyOn(component.snackBar, 'open')
    spyOn(router, 'navigate')
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
    displayErrorSpy = spyOn(component, 'displayError').and.callThrough()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(tokenSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).toHaveBeenCalled()
    expect(getAMTFeaturesSpy).toHaveBeenCalled()
    expect(getRedirectionStatusSpy).toHaveBeenCalled()
  })
  it('should have correct state on websocket events', () => {
    authServiceStub.startwebSocket.emit(true)
    expect(component.isLoading).toBeFalse()
    authServiceStub.stopwebSocket.emit(true)
    expect(component.isDisconnecting).toBeTruthy()
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting = true
    component.deviceKVMStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(0)
  })
  it('should show error and hide loading when isDisconnecting is false', () => {
    component.isDisconnecting = false
    component.deviceKVMStatus(0)
    expect(snackBarSpy).toHaveBeenCalledOnceWith(
      'Connecting to KVM failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.',
      undefined,
      SnackbarDefaults.defaultError
    )
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(0)
  })
  it('should hide loading when connected', () => {
    component.deviceKVMStatus(2)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(2)
  })
  it('should not show error when NavigationStart triggers', () => {
    eventSubject.next(new NavigationStart(1, 'regular'))
    expect(snackBarSpy).not.toHaveBeenCalled()
  })
  it('should show dialog when called', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(null), close: null })
    const openSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.userConsentDialog()
    expect(openSpy).toHaveBeenCalled()
  })
  it('power up alert dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.showPowerUpAlert()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('enable KVM dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.enableKvmDialog()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('cancel enable kvm request msg true', async () => {
    component.cancelEnableKvmResponse(true)
    expect(snackBarSpy).toHaveBeenCalled()
    expect(component.readyToLoadKvm).toBe(false)
  })
  it('cancel enable sol request msg false', async () => {
    component.cancelEnableKvmResponse(false)
    expect(snackBarSpy).toHaveBeenCalled()
    expect(component.isLoading).toBe(false)
  })
  it('getAMTFeatures', (done) => {
    component.getAMTFeatures().subscribe({
      next: (result) => {
        expect(getAMTFeaturesSpy).toHaveBeenCalled()
        expect(result).toEqual({
          userConsent: 'none',
          KVM: true,
          SOL: true,
          IDER: true,
          redirection: true,
          optInState: 0
        })
        expect(component.isLoading).toBe(true)
        done()
      }
    })
  })
  it('should call getRedirectionStatus and return expected data', (done) => {
    component.getRedirectionStatus('test-guid').subscribe((response) => {
      expect(devicesService.getRedirectionStatus).toHaveBeenCalledWith('test-guid')
      expect(response).toEqual({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
      done()
    })
  })
  it('getRedirectionStatus error', (done) => {
    component.isLoading = true
    getRedirectionStatusSpy = devicesService.getRedirectionStatus.and.returnValue(throwError(new Error('err')))
    component.getRedirectionStatus('test-guid').subscribe({
      error: () => {
        expect(getRedirectionStatusSpy).toHaveBeenCalled()
        expect(displayErrorSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('should set redirectionStatus correctly when handling redirection status', () => {
    const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: false }
    component.handleRedirectionStatus(mockRedirectionStatus).subscribe(() => {
      expect(component.redirectionStatus).toEqual(mockRedirectionStatus)
    })
  })
  it('should set redirectionStatus correctly and return null when handling redirection status', (done) => {
    const mockRedirectionStatus = { isKVMConnected: true, isSOLConnected: false, isIDERConnected: false }
    component.handleRedirectionStatus(mockRedirectionStatus).subscribe(() => {
      expect(component.redirectionStatus).toEqual(mockRedirectionStatus)
      done()
    })
  })
  it('getPowerState', async () => {
    component.getPowerState('111')
    expect(getPowerStateSpy).toHaveBeenCalled()
  })
  it('getPowerState error', (done) => {
    component.isLoading = true
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(throwError(new Error('err')))
    component.getPowerState('111').subscribe({
      error: () => {
        expect(getPowerStateSpy).toHaveBeenCalled()
        expect(displayErrorSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('checkUserConsent yes', async () => {
    component.checkUserConsent()
    expect(component.readyToLoadKvm).toBe(true)
  })
  it('checkUserConsent no', async () => {
    component.amtFeatures = { userConsent: 'all', KVM: true, SOL: true, IDER: true, redirection: true, optInState: 0 }
    component.readyToLoadKvm = false
    component.checkUserConsent()
    expect(component.readyToLoadKvm).toBe(false)
  })
  it('handlePowerState 2', (done) => {
    component.handlePowerState({ powerstate: 2 }).subscribe((results) => {
      expect(results).toEqual(true)
      done()
    })
  })
  it('handlePowerState 0', (done) => {
    spyOn(component, 'showPowerUpAlert').and.returnValue(of(true))
    component.handlePowerState({ powerstate: 0 }).subscribe({
      next: (results) => {
        expect(sendPowerActionSpy).toHaveBeenCalled()
        expect(results).toEqual({})
        done()
      }
    })
  })
  it('handleAMTFeatureResponse KVM already enabled', (done) => {
    component.amtFeatures = { userConsent: 'none', KVM: true, SOL: true, IDER: true, redirection: true, optInState: 0 }
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      next: (results) => {
        expect(results).toEqual(true)
        done()
      }
    })
  })
  it('handleAMTFeatureResponse enableKvmDialog error', (done) => {
    component.amtFeatures = { userConsent: 'none', KVM: false, SOL: true, IDER: true, redirection: true, optInState: 0 }
    spyOn(component, 'enableKvmDialog').and.returnValue(throwError(new Error('err')))
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      error: () => {
        expect(displayErrorSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('handleAMTFeatureResponse cancel enableSol', async () => {
    const cancelEnableSolResponseSpy = spyOn(component, 'cancelEnableKvmResponse')
    component.amtFeatures = { userConsent: 'none', KVM: false, SOL: true, IDER: true, redirection: true, optInState: 0 }
    spyOn(component, 'enableKvmDialog').and.returnValue(of(false))
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      next: (results) => {
        expect(cancelEnableSolResponseSpy).toHaveBeenCalled()
        expect(results).toEqual(false)
      }
    })
  })
  it('handleAMTFeatureResponse enableSol', (done) => {
    component.amtFeatures = { userConsent: 'none', KVM: false, SOL: true, IDER: true, redirection: true, optInState: 0 }
    spyOn(component, 'enableKvmDialog').and.returnValue(of(true))
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      next: () => {
        expect(setAmtFeaturesSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('handleUserConsentDecision false', async () => {
    component.handleUserConsentDecision(false)
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('handleUserConsentResponse', async () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.handleUserConsentResponse(userConsentResponse)
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('handleUserConsentResponse uc dialog results', (done) => {
    spyOn(component, 'userConsentDialog').and.returnValue(of(true))
    const ucDialogCloseSpy = spyOn(component, 'afterUserConsentDialogClosed').and.returnValue()
    component.handleUserConsentResponse(userConsentResponse).subscribe({
      next: () => {
        expect(ucDialogCloseSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('handleUserConsentResponse uc dialog null', (done) => {
    spyOn(component, 'userConsentDialog').and.returnValue(of(null))
    const ucDialogCloseSpy = spyOn(component, 'cancelUserConsentCode').and.returnValue()
    component.handleUserConsentResponse(userConsentResponse).subscribe({
      next: () => {
        expect(ucDialogCloseSpy).toHaveBeenCalled()
        done()
      }
    })
  })

  it('handleUserConsentResponse false', async () => {
    component.handleUserConsentResponse(false)
    expect(displayErrorSpy).toHaveBeenCalled()
  })
  it('afterUserContentDialogClosed Send', async () => {
    optInCodeResponseSpy = spyOn(component, 'sendOptInCodeResponse')
    component.afterUserConsentDialogClosed(userConsentData)
    expect(optInCodeResponseSpy).toHaveBeenCalled()
  })
  it('afterUserContentDialogClosed Cancel', async () => {
    userConsentData.results.Header.Action =
      'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService/CancelOptInResponse'
    optInCodeResponseSpy = spyOn(component, 'cancelOptInCodeResponse')
    component.afterUserConsentDialogClosed(userConsentData)
    expect(optInCodeResponseSpy).toHaveBeenCalled()
  })
  it('cancelOptInCodeResponse 0', async () => {
    component.cancelOptInCodeResponse(userConsentResponse)
    expect(displayErrorSpy).toHaveBeenCalled()
  })
  it('cancelOptInCodeResponse 1', async () => {
    userConsentResponse.Body = { ReturnValue: 1, ReturnValueStr: 'Success' }
    component.cancelOptInCodeResponse(userConsentResponse)
    expect(displayErrorSpy).toHaveBeenCalled()
  })
  it('sendOptInCodeResponse 0', async () => {
    component.sendOptInCodeResponse(userConsentResponse)
    expect(component.readyToLoadKvm).toEqual(true)
  })
  it('sendOptInCodeResponse 2066', async () => {
    userConsentResponse.Body = { ReturnValue: 2066, ReturnValueStr: 'Success' }
    component.sendOptInCodeResponse(userConsentResponse)
    expect(getAMTFeaturesSpy).toHaveBeenCalled()
  })
  it('sendOptInCodeResponse 1', async () => {
    userConsentResponse.Body = { ReturnValue: 1, ReturnValueStr: 'Success' }
    component.sendOptInCodeResponse(userConsentResponse)
    expect(displayErrorSpy).toHaveBeenCalled()
    expect(component.isLoading).toEqual(false)
  })
  it('reqUserConsentCode ', async () => {
    component.reqUserConsentCode('111')
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('cancelUserConsentCode ', async () => {
    component.cancelUserConsentCode('111')
    expect(cancelUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('deviceStatus 3', async () => {
    component.deviceKVMStatus(3)
    expect(component.isLoading).toEqual(false)
  })
  it('deviceStatus 0', async () => {
    component.isDisconnecting = false
    component.deviceKVMStatus(0)
    expect(component.isLoading).toEqual(false)
    expect(displayErrorSpy).toHaveBeenCalled()
    expect(component.isDisconnecting).toEqual(false)
  })
  it('displayError', () => {
    component.displayError('test txt')
    expect(snackBarSpy).toHaveBeenCalled()
  })
  it('displayWarning', () => {
    component.displayWarning('test txt')
    expect(snackBarSpy).toHaveBeenCalled()
  })
  // IDER
  it('should set isIDERActive to false when event is 0', () => {
    component.deviceIDERStatus(0)
    expect(component.isIDERActive).toBeFalse()
  })
  it('should set isIDERActive to true when event is 3', () => {
    component.deviceIDERStatus(3)
    expect(component.isIDERActive).toBeTrue()
  })
  it('should not change isIDERActive for other event values', () => {
    component.deviceIDERStatus(1)
    expect(component.isIDERActive).toBeFalse()
  })
  it('should set diskImage and emit true on file selection', () => {
    const mockFile = new File([''], 'test-file.txt', { type: 'text/plain' })
    const mockEvt = { target: { files: [mockFile] } } as unknown as Event

    const deviceIDERConnectioSpy = spyOn(component.deviceIDERConnection, 'emit')
    component.onFileSelected(mockEvt)

    expect(component.diskImage).toEqual(mockFile)
    expect(deviceIDERConnectioSpy).toHaveBeenCalledWith(true)
  })
  it('should emit false on canceling IDER', () => {
    const deviceIDERConnectioSpy = spyOn(component.deviceIDERConnection, 'emit')
    component.onCancelIDER()

    expect(deviceIDERConnectioSpy).toHaveBeenCalledWith(false)
  })
})
