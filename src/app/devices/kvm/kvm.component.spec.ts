/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, EventEmitter, Output, input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, RouterEvent, Router, RouterModule } from '@angular/router'
import { of, ReplaySubject, Subject, throwError } from 'rxjs'
import { KvmComponent } from './kvm.component'
import { DevicesService } from '../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device } from 'src/models/models'
import { UserConsentService } from '../user-consent.service'
import { IDERComponent, KVMComponent } from '@device-management-toolkit/ui-toolkit-angular'
import { TranslateModule } from '@ngx-translate/core'

describe('KvmComponent', () => {
  let component: KvmComponent
  let fixture: ComponentFixture<KvmComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let getRedirectionStatusSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let sendPowerActionSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy
  let getDisplaySelectionSpy: jasmine.Spy
  let setDisplaySelectionSpy: jasmine.Spy
  let snackBarSpy: jasmine.Spy
  let router: Router
  let displayErrorSpy: jasmine.Spy
  let devicesService: jasmine.SpyObj<DevicesService>
  let userConsentService: jasmine.SpyObj<UserConsentService>

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
      'getRedirectionStatus',
      'getDisplaySelection',
      'setDisplaySelection'
    ])
    userConsentService = jasmine.createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])

    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(
      of({
        userConsent: 'none',
        KVM: true,
        SOL: true,
        IDER: true,
        redirection: true,
        kvmAvailable: true,
        optInState: 0,
        httpsBootSupported: true,
        ocr: true,
        winREBootSupported: true,
        localPBABootSupported: true,
        remoteErase: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
    )
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(
      of({
        userConsent: 'none',
        KVM: true,
        SOL: true,
        IDER: true,
        redirection: true,
        kvmAvailable: true,
        optInState: 0,
        httpsBootSupported: true,
        ocr: true,
        winREBootSupported: true,
        localPBABootSupported: true,
        remoteErase: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
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
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.and.returnValue(of({ token: '123' }))
    getDisplaySelectionSpy = devicesService.getDisplaySelection.and.returnValue(
      of({
        displays: [
          { displayIndex: 0, isActive: true, resolutionX: 1920, resolutionY: 1080, upperLeftX: 0, upperLeftY: 0 },
          { displayIndex: 1, isActive: false, resolutionX: 0, resolutionY: 0, upperLeftX: 0, upperLeftY: 0 }
        ]
      })
    )
    setDisplaySelectionSpy = devicesService.setDisplaySelection.and.returnValue(of({ success: true }))
    userConsentService.handleUserConsentDecision.and.returnValue(of(true))
    userConsentService.handleUserConsentResponse.and.returnValue(of(true))

    devicesService.device = new Subject<Device>()
    devicesService.deviceState = new EventEmitter<number>()
    const websocketStub = {}
    authServiceStub = {}

    @Component({
      // eslint-disable-next-line @angular-eslint/component-selector
      selector: 'amt-ider',
      imports: []
    })
    class TestAMTIDERComponent {}

    @Component({
      // eslint-disable-next-line @angular-eslint/component-selector
      selector: 'amt-kvm',
      template: '<canvas></canvas>'
    })
    class TestAMTKVMComponent {
      readonly deviceId = input('')

      readonly mpsServer = input('')

      readonly authToken = input('')

      readonly deviceConnection = input('')

      readonly selectedEncoding = input('')

      @Output()
      deviceStatus = new EventEmitter<number>()
    }

    TestBed.overrideComponent(KvmComponent, {
      remove: { imports: [IDERComponent] },
      add: { imports: [TestAMTIDERComponent] }
    })
    TestBed.overrideComponent(KvmComponent, {
      remove: { imports: [KVMComponent] },
      add: { imports: [TestAMTKVMComponent] }
    })
    TestBed.overrideComponent(KvmComponent, {
      remove: { imports: [KVMComponent] },
      add: { imports: [TestAMTKVMComponent] }
    })

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterModule,
        KvmComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: { ...devicesService, ...websocketStub, ...authServiceStub } },
        { provide: UserConsentService, useValue: userConsentService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } }
      ]
    })

    router = TestBed.inject(Router)
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(KvmComponent)
    component = fixture.componentInstance
    snackBarSpy = spyOn(component.snackBar, 'open')
    spyOn(router, 'navigate')

    displayErrorSpy = spyOn(component, 'displayError').and.callThrough()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    fixture.detectChanges()
    expect(tokenSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).toHaveBeenCalled()
    expect(getAMTFeaturesSpy).toHaveBeenCalled()
    expect(getRedirectionStatusSpy).toHaveBeenCalled()
    expect(getDisplaySelectionSpy).toHaveBeenCalled()
  })
  it('should have correct state on connect/disconnect methods', () => {
    // Initial state should be disconnected since we changed to signal(false)
    expect(component.deviceKVMConnection()).toBeFalsy()

    // Test connect method
    component.connect()
    expect(component.isDisconnecting).toBeFalsy()
    expect(component.deviceKVMConnection()).toBeTruthy()

    // Test disconnect method
    component.disconnect()
    expect(component.isDisconnecting).toBeTruthy()
    expect(component.deviceKVMConnection()).toBeFalsy()
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting = true
    component.deviceKVMStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBeFalse()
    expect(component.deviceState()).toBe(0)
  })
  it('should show error and hide loading when isDisconnecting is false', () => {
    component.isDisconnecting = false
    component.deviceKVMStatus(0)
    expect(snackBarSpy).toHaveBeenCalledOnceWith('errors.kvmConnection.value', undefined, SnackbarDefaults.defaultError)
    expect(component.isLoading()).toBeFalse()
    expect(component.deviceState()).toBe(0)
  })
  it('should hide loading when connected', () => {
    component.deviceKVMStatus(2)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBeFalse()
    expect(component.deviceState()).toBe(2)
  })
  it('should change display and call setDisplaySelection', () => {
    fixture.detectChanges()
    component.onDisplayChange(0)
    expect(setDisplaySelectionSpy).toHaveBeenCalledWith('', { displayIndex: 0 })
  })
  it('should not show error when NavigationStart triggers', () => {
    eventSubject.next(new NavigationStart(1, 'regular'))
    expect(snackBarSpy).not.toHaveBeenCalled()
  })
  it('power up alert dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.showPowerUpAlert()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('enable KVM dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
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
    expect(component.isLoading()).toBe(false)
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
          kvmAvailable: true,
          optInState: 0,
          httpsBootSupported: true,
          ocr: true,
          winREBootSupported: true,
          localPBABootSupported: true,
          remoteErase: true,
          pbaBootFilesPath: [],
          winREBootFilesPath: {
            instanceID: '',
            biosBootString: '',
            bootString: ''
          }
        })
        expect(component.isLoading()).toBe(true)
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
  xit('getRedirectionStatus error', (done) => {
    component.isLoading.set(true)
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
  xit('getPowerState error', (done: any) => {
    component.isLoading.set(true)
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
    fixture.detectChanges()
    expect(component.readyToLoadKvm).toBe(true)
  })
  it('checkUserConsent no', async () => {
    component.amtFeatures.set({
      userConsent: 'all',
      KVM: true,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0,
      httpsBootSupported: true,
      ocr: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      remoteErase: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
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
    component.amtFeatures.set({
      userConsent: 'none',
      KVM: true,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0,
      httpsBootSupported: true,
      ocr: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      remoteErase: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
    component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
      next: (results) => {
        expect(results).toEqual(true)
        done()
      }
    })
  })
  it('handleAMTFeatureResponse enableKvmDialog error', (done) => {
    component.amtFeatures.set({
      userConsent: 'none',
      KVM: false,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0,
      httpsBootSupported: true,
      ocr: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      remoteErase: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
    spyOn(component, 'enableKvmDialog').and.returnValue(throwError(new Error('err')))
    component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
      error: () => {
        expect(displayErrorSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('handleAMTFeatureResponse cancel enableSol', async () => {
    const cancelEnableSolResponseSpy = spyOn(component, 'cancelEnableKvmResponse')
    component.amtFeatures.set({
      userConsent: 'none',
      KVM: false,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0,
      httpsBootSupported: true,
      ocr: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      remoteErase: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
    spyOn(component, 'enableKvmDialog').and.returnValue(of(false))
    component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
      next: (results) => {
        expect(cancelEnableSolResponseSpy).toHaveBeenCalled()
        expect(results).toEqual(false)
      }
    })
  })
  it('handleAMTFeatureResponse enableSol', (done) => {
    component.amtFeatures.set({
      userConsent: 'none',
      KVM: false,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0,
      httpsBootSupported: true,
      ocr: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      remoteErase: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
    spyOn(component, 'enableKvmDialog').and.returnValue(of(true))
    component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
      next: () => {
        expect(setAmtFeaturesSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('deviceStatus 3', async () => {
    component.deviceKVMStatus(3)
    expect(component.isLoading()).toEqual(false)
  })
  it('deviceStatus 0', async () => {
    component.isDisconnecting = false
    component.deviceKVMStatus(0)
    expect(component.isLoading()).toEqual(false)
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
    expect(component.isIDERActive()).toBeFalse()
  })
  it('should set isIDERActive to true when event is 3', () => {
    component.deviceIDERStatus(3)
    expect(component.isIDERActive()).toBeTrue()
  })
  it('should not change isIDERActive for other event values', () => {
    component.deviceIDERStatus(1)
    expect(component.isIDERActive()).toBeFalse()
  })
  it('should set diskImage and emit true on file selection', () => {
    const mockFile = new File([''], 'test-file.txt', { type: 'text/plain' })
    const mockEvt = { target: { files: [mockFile] } } as unknown as Event

    const deviceIDERConnectionSpy = spyOn(component.deviceIDERConnection, 'set')
    component.onFileSelected(mockEvt)

    expect(component.diskImage).toEqual(mockFile)
    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(true)
  })
  it('should emit false on canceling IDER', () => {
    const deviceIDERConnectionSpy = spyOn(component.deviceIDERConnection, 'set')
    component.onCancelIDER()

    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(false)
  })

  // Hot Key tests
  it('should send hotkey when sendHotkey is called with selectedHotkey', () => {
    const hotKeySignalSpy = spyOn(component.hotKeySignal, 'set')
    component.selectedHotkey = 'ctrl-alt-del'

    component.sendHotkey()

    expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-del')
  })

  it('should not send hotkey when sendHotkey is called without selectedHotkey', () => {
    const hotKeySignalSpy = spyOn(component.hotKeySignal, 'set')
    component.selectedHotkey = null

    component.sendHotkey()

    expect(hotKeySignalSpy).not.toHaveBeenCalled()
  })

  it('should reset hotkey signal after timeout', (done) => {
    const hotKeySignalSpy = spyOn(component.hotKeySignal, 'set')
    component.selectedHotkey = 'ctrl-alt-del'

    component.sendHotkey()

    expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-del')

    setTimeout(() => {
      expect(hotKeySignalSpy).toHaveBeenCalledWith(null)
      done()
    }, 150)
  })
})
