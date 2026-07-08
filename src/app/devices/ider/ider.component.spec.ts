/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, EventEmitter } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, RouterEvent, Router } from '@angular/router'
import { of, Subject, throwError } from 'rxjs'
import { IderComponent } from './ider.component'
import { DevicesService } from '../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device } from '../../../models/models'
import { UserConsentService } from '../user-consent.service'
import { IDERComponent } from '@device-management-toolkit/ui-toolkit-angular'
import { provideTranslateService } from '@ngx-translate/core'

describe('IderComponent', () => {
  let component: IderComponent
  let fixture: ComponentFixture<IderComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let getPowerStateCachedSpy: jasmine.Spy
  let getRedirectionStatusSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let getAMTFeaturesCachedSpy: jasmine.Spy
  let sendPowerActionSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy
  let setDisplaySelectionSpy: jasmine.Spy
  let snackBarSpy: jasmine.Spy
  let eventSubject: Subject<RouterEvent>
  let displayErrorSpy: jasmine.Spy
  let displayWarningSpy: jasmine.Spy
  let devicesService: jasmine.SpyObj<DevicesService>
  let userConsentService: jasmine.SpyObj<UserConsentService>
  let dialogSpy: jasmine.SpyObj<MatDialog>

  const amtFeaturesResponse = {
    userConsent: 'none',
    KVM: false,
    SOL: true,
    IDER: true,
    redirection: true,
    kvmAvailable: false,
    optInState: 0,
    httpsBootSupported: true,
    ocr: true,
    winREBootSupported: true,
    localPBABootSupported: true,
    remoteErase: false,
    pbaBootFilesPath: [],
    winREBootFilesPath: {
      instanceID: '',
      biosBootString: '',
      bootString: ''
    }
  }

  beforeEach(async () => {
    eventSubject = new Subject<RouterEvent>()

    devicesService = jasmine.createSpyObj('DevicesService', [
      'sendPowerAction',
      'getDevice',
      'getPowerState',
      'getPowerStateCached',
      'setAmtFeatures',
      'getAMTFeatures',
      'getAMTFeaturesCached',
      'getRedirectionExpirationToken',
      'getRedirectionStatus',
      'setDisplaySelection'
    ])
    userConsentService = jasmine.createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])

    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of(amtFeaturesResponse))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(of(amtFeaturesResponse))
    getAMTFeaturesCachedSpy = devicesService.getAMTFeaturesCached.and.returnValue(of(amtFeaturesResponse))
    getRedirectionStatusSpy = devicesService.getRedirectionStatus.and.returnValue(
      of({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
    )
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    getPowerStateCachedSpy = devicesService.getPowerStateCached.and.returnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.and.returnValue(of({ token: '123' }))
    setDisplaySelectionSpy = devicesService.setDisplaySelection.and.returnValue(of({ success: true }))

    userConsentService.handleUserConsentDecision.and.returnValue(of(true))
    userConsentService.handleUserConsentResponse.and.returnValue(of(true))
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    dialogSpy.open.and.returnValue(jasmine.createSpyObj({ afterClosed: of(true), close: null }))

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

    TestBed.overrideComponent(IderComponent, {
      remove: { imports: [IDERComponent] },
      add: { imports: [TestAMTIDERComponent] }
    })

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        IderComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: { ...devicesService, ...websocketStub, ...authServiceStub } },
        { provide: UserConsentService, useValue: userConsentService },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate'], { events: eventSubject.asObservable() })
        }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(IderComponent)
    component = fixture.componentInstance
    snackBarSpy = spyOn(component.snackBar, 'open')

    displayErrorSpy = spyOn(component, 'displayError').and.callThrough()
    displayWarningSpy = spyOn(component, 'displayWarning').and.callThrough()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    fixture.detectChanges()
    expect(tokenSpy).toHaveBeenCalled()
    expect(getPowerStateCachedSpy).toHaveBeenCalled()
    expect(getAMTFeaturesCachedSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).not.toHaveBeenCalled()
    expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
    expect(getRedirectionStatusSpy).toHaveBeenCalled()
  })

  it('should set isDisconnecting to true on NavigationStart event', () => {
    fixture.detectChanges()
    expect(component.isDisconnecting).toBeFalse()
    eventSubject.next(new NavigationStart(1, '/some-route'))
    expect(component.isDisconnecting).toBeTrue()
  })

  it('should not show error when NavigationStart triggers', () => {
    eventSubject.next(new NavigationStart(1, 'regular'))
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  // connect()
  it('should reset deviceState to -1 and call init on connect', () => {
    const initSpy = spyOn(component, 'init')
    component.deviceState.set(0)
    component.connect()
    expect(component.deviceState()).toBe(-1)
    expect(initSpy).toHaveBeenCalled()
  })

  it('connect() prefetches the auth token in parallel with init()', () => {
    tokenSpy.calls.reset()
    const initSpy = spyOn(component, 'init')
    component.connect()
    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(tokenSpy).toHaveBeenCalledTimes(1)
  })

  // postUserConsentDecision()
  it('should set isLoading to false, loadingStatus to empty, and deviceState to 0 when result is false', (done) => {
    component.postUserConsentDecision(false).subscribe(() => {
      expect(component.isLoading()).toBeFalse()
      expect(component.loadingStatus()).toBe('')
      expect(component.deviceState()).toBe(0)
      done()
    })
  })

  it('should return of(null) when result is false', (done) => {
    component.postUserConsentDecision(false).subscribe((result) => {
      expect(result).toBeNull()
      done()
    })
  })

  it('does not refresh the auth token when consent is denied', (done) => {
    tokenSpy.calls.reset()
    component.authToken.set('untouched')
    component.postUserConsentDecision(false).subscribe(() => {
      expect(tokenSpy).not.toHaveBeenCalled()
      expect(component.authToken()).toBe('untouched')
      done()
    })
  })

  it('refreshes the auth token before completing when result is true', (done) => {
    tokenSpy.calls.reset()
    tokenSpy.and.returnValue(of({ token: 'post-consent-token' }))
    component.authToken.set('stale')
    component.postUserConsentDecision(true).subscribe(() => {
      expect(tokenSpy).toHaveBeenCalled()
      expect(component.authToken()).toBe('post-consent-token')
      done()
    })
  })

  it('init runs consent handlers and refreshes token after consent success', () => {
    tokenSpy.calls.reset()
    fixture.detectChanges()
    expect(component.loadingStatus()).toBe('ider.status.connectingIder.value')
    expect(userConsentService.handleUserConsentDecision).toHaveBeenCalledWith(
      true,
      '',
      jasmine.objectContaining({ userConsent: 'none' })
    )
    expect(userConsentService.handleUserConsentResponse).toHaveBeenCalledWith('', true, 'IDER')
    expect(tokenSpy.calls.count()).toBe(1)
  })

  it('postUserConsentDecision does not issue a duplicate AMT features fetch', (done) => {
    getAMTFeaturesSpy.calls.reset()
    getAMTFeaturesCachedSpy.calls.reset()
    component.postUserConsentDecision(true).subscribe(() => {
      expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
      expect(getAMTFeaturesCachedSpy).not.toHaveBeenCalled()
      done()
    })
  })

  // checkUserConsent()
  it('checkUserConsent returns true when userConsent is none', (done) => {
    component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'none' })
    component.checkUserConsent().subscribe((result) => {
      expect(result).toBeTrue()
      done()
    })
  })

  it('checkUserConsent returns true when optInState is 3', (done) => {
    component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 3 })
    component.checkUserConsent().subscribe((result) => {
      expect(result).toBeTrue()
      done()
    })
  })

  it('checkUserConsent returns true when optInState is 4', (done) => {
    component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 4 })
    component.checkUserConsent().subscribe((result) => {
      expect(result).toBeTrue()
      done()
    })
  })

  it('checkUserConsent returns false when userConsent is not none and optInState is not 3 or 4', (done) => {
    component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 0 })
    component.checkUserConsent().subscribe((result) => {
      expect(result).toBeFalse()
      done()
    })
  })

  it('checkUserConsent returns false when amtFeatures is null', (done) => {
    component.amtFeatures.set(null)
    component.checkUserConsent().subscribe((result) => {
      expect(result).toBeFalse()
      done()
    })
  })

  // handlePowerState()
  it('handlePowerState returns true when device is powered on (powerstate 2)', (done) => {
    component.handlePowerState({ powerstate: 2 }).subscribe((result) => {
      expect(result).toBeTrue()
      done()
    })
  })

  it('handlePowerState shows power up alert when device is not powered on', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.and.returnValue(dialogRefSpyObj)
    component.handlePowerState({ powerstate: 0 }).subscribe()
    expect(dialogSpy.open).toHaveBeenCalled()
  })

  it('handlePowerState calls sendPowerAction when user confirms power up', (done) => {
    spyOn(component, 'showPowerUpAlert').and.returnValue(of(true))
    component.handlePowerState({ powerstate: 0 }).subscribe(() => {
      expect(sendPowerActionSpy).toHaveBeenCalledWith(component.deviceId(), 2)
      done()
    })
  })

  it('handlePowerState returns null when user declines power up', (done) => {
    spyOn(component, 'showPowerUpAlert').and.returnValue(of(false))
    component.handlePowerState({ powerstate: 0 }).subscribe((result) => {
      expect(result).toBeNull()
      expect(sendPowerActionSpy).not.toHaveBeenCalled()
      done()
    })
  })

  // getRedirectionStatus()
  it('should call getRedirectionStatus and return expected data', (done) => {
    component.getRedirectionStatus('test-guid').subscribe((response) => {
      expect(devicesService.getRedirectionStatus).toHaveBeenCalledWith('test-guid')
      expect(response).toEqual({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
      done()
    })
  })

  it('getRedirectionStatus error', (done) => {
    component.isLoading.set(true)
    getRedirectionStatusSpy = devicesService.getRedirectionStatus.and.returnValue(throwError(() => new Error('err')))
    component.getRedirectionStatus('test-guid').subscribe({
      error: () => {
        expect(getRedirectionStatusSpy).toHaveBeenCalled()
        expect(displayErrorSpy).toHaveBeenCalled()
        devicesService.getRedirectionStatus.and.returnValue(
          of({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
        )
        done()
      }
    })
  })

  it('should set redirectionStatus and return true when IDER is not connected', (done) => {
    const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: false }
    component.amtFeatures.set({ ...amtFeaturesResponse, IDER: true })
    component.handleRedirectionStatus(mockRedirectionStatus).subscribe((result) => {
      expect(component.redirectionStatus).toEqual(mockRedirectionStatus)
      expect(result).toBeTrue()
      done()
    })
  })

  it('should return null and display error when IDER is already connected', (done) => {
    const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: true }
    component.amtFeatures.set({ ...amtFeaturesResponse, IDER: true })
    component.handleRedirectionStatus(mockRedirectionStatus).subscribe((result) => {
      expect(result).toBeNull()
      expect(displayWarningSpy).toHaveBeenCalled()
      expect(displayErrorSpy).not.toHaveBeenCalled()
      done()
    })
  })

  it('should return null when IDER is connected even if AMT IDER feature is false', (done) => {
    const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: true }
    component.amtFeatures.set({ ...amtFeaturesResponse, IDER: false })
    component.handleRedirectionStatus(mockRedirectionStatus).subscribe((result) => {
      expect(result).toBeNull()
      expect(displayWarningSpy).toHaveBeenCalled()
      expect(displayErrorSpy).not.toHaveBeenCalled()
      done()
    })
  })

  // getPowerState()
  it('getPowerState calls devicesService.getPowerState', () => {
    component.getPowerState('111')
    expect(getPowerStateSpy).toHaveBeenCalledWith('111')
  })

  it('getPowerState error', (done) => {
    component.isLoading.set(true)
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(throwError(() => new Error('err')))
    component.getPowerState('111').subscribe({
      error: () => {
        expect(getPowerStateSpy).toHaveBeenCalled()
        expect(displayErrorSpy).toHaveBeenCalled()
        devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
        done()
      }
    })
  })

  // getPowerStateCached()
  it('getPowerStateCached delegates to the service cache variant', () => {
    getPowerStateSpy.calls.reset()
    getPowerStateCachedSpy.calls.reset()
    component.getPowerStateCached('111').subscribe()
    expect(getPowerStateCachedSpy).toHaveBeenCalledWith('111')
    expect(getPowerStateSpy).not.toHaveBeenCalled()
  })

  // getAMTFeatures()
  it('getAMTFeatures sets isLoading to true and calls service', (done) => {
    component.isLoading.set(false)
    component.getAMTFeatures().subscribe((result) => {
      expect(getAMTFeaturesSpy).toHaveBeenCalled()
      expect(result).toEqual(amtFeaturesResponse)
      expect(component.isLoading()).toBeTrue()
      done()
    })
  })

  // getAMTFeaturesCached()
  it('getAMTFeaturesCached delegates to the service cache variant', (done) => {
    component.getAMTFeaturesCached().subscribe(() => {
      expect(getAMTFeaturesCachedSpy).toHaveBeenCalledWith('')
      expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
      expect(component.isLoading()).toBeTrue()
      done()
    })
  })

  // handleAMTFeaturesResponse()
  it('handleAMTFeaturesResponse sets amtFeatures and skips setAmtFeatures when IDER is already connected', (done) => {
    component.handleAMTFeaturesResponse(amtFeaturesResponse as any).subscribe(() => {
      expect(component.amtFeatures()).toEqual(amtFeaturesResponse as any)
      expect(setAmtFeaturesSpy).not.toHaveBeenCalled()
      done()
    })
  })

  it('handleAMTFeaturesResponse uses default values when AMT features properties are undefined', (done) => {
    const partialFeatures = { userConsent: undefined } as any
    component.handleAMTFeaturesResponse(partialFeatures).subscribe(() => {
      expect(setAmtFeaturesSpy).toHaveBeenCalledWith(
        component.deviceId(),
        jasmine.objectContaining({
          userConsent: '',
          enableSOL: false,
          enableIDER: true,
          ocr: false,
          enableKVM: false,
          remoteErase: false
        })
      )
      done()
    })
  })

  // showPowerUpAlert()
  it('power up alert dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.and.returnValue(dialogRefSpyObj)
    component.showPowerUpAlert()
    expect(dialogSpy.open).toHaveBeenCalled()
  })

  // onFileSelected()
  it('should set diskImage and set deviceIDERConnection to true on file selection', () => {
    const mockFile = new File([''], 'test-file.iso', { type: 'application/octet-stream' })
    const mockEvt = { target: { files: [mockFile] } } as unknown as Event
    const deviceIDERConnectionSpy = spyOn(component.deviceIDERConnection, 'set')

    component.onFileSelected(mockEvt)

    expect(component.diskImage).toEqual(mockFile)
    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(true)
  })

  it('should set diskImage to null when no file is selected', () => {
    const mockEvt = { target: { files: [] } } as unknown as Event
    component.onFileSelected(mockEvt)
    expect(component.diskImage).toBeNull()
  })

  // onCancelIDER()
  it('should set deviceIDERConnection to false on cancel IDER', () => {
    const deviceIDERConnectionSpy = spyOn(component.deviceIDERConnection, 'set')
    component.onCancelIDER()
    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(false)
  })

  it('should clear file input value on cancel IDER', () => {
    const mockFileInput = document.createElement('input')
    mockFileInput.id = 'file'
    document.body.appendChild(mockFileInput)

    component.onCancelIDER()
    expect(mockFileInput.value).toBe('')

    document.body.removeChild(mockFileInput)
  })

  it('should not throw when file input element does not exist on cancel IDER', () => {
    expect(() => component.onCancelIDER()).not.toThrow()
  })

  // onDisplayChange()
  it('should change display and call setDisplaySelection', () => {
    fixture.detectChanges()
    component.onDisplayChange(1)
    expect(setDisplaySelectionSpy).toHaveBeenCalledWith('', { displayIndex: 1 })
    expect(component.selectedDisplay()).toBe(1)
  })

  // deviceIDERStatus()
  it('should set isIDERActive to false when event is 0', () => {
    component.isIDERActive.set(true)
    component.deviceIDERStatus(0)
    expect(component.isIDERActive()).toBeFalse()
  })

  it('should display warning with iderEnded key when event is 0', () => {
    component.deviceIDERStatus(0)
    expect(displayWarningSpy).toHaveBeenCalled()
  })

  it('should set isIDERActive to true when event is 3', () => {
    component.isIDERActive.set(false)
    component.deviceIDERStatus(3)
    expect(component.isIDERActive()).toBeTrue()
  })

  it('should display warning with iderActive key when event is 3', () => {
    component.deviceIDERStatus(3)
    expect(displayWarningSpy).toHaveBeenCalled()
  })

  it('should not change isIDERActive for other event values', () => {
    component.isIDERActive.set(false)
    component.deviceIDERStatus(1)
    expect(component.isIDERActive()).toBeFalse()
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  // sendHotkey()
  it('should send hotkey when sendHotkey is called with selectedHotkey', () => {
    const hotKeySignalSpy = spyOn(component.hotKeySignal, 'set')
    component.selectedHotkey = 'ctrl-alt-del'
    component.sendHotkey()
    expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-del')
  })

  it('should not send hotkey when selectedHotkey is null', () => {
    const hotKeySignalSpy = spyOn(component.hotKeySignal, 'set')
    component.selectedHotkey = null
    component.sendHotkey()
    expect(hotKeySignalSpy).not.toHaveBeenCalled()
  })

  it('should reset hotkey signal to null after 100ms', (done) => {
    const hotKeySignalSpy = spyOn(component.hotKeySignal, 'set')
    component.selectedHotkey = 'ctrl-alt-del'
    component.sendHotkey()
    expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-del')
    setTimeout(() => {
      expect(hotKeySignalSpy).toHaveBeenCalledWith(null)
      done()
    }, 150)
  })

  // displayError() / displayWarning()
  it('displayError calls snackBar.open', () => {
    component.displayError('test error')
    expect(snackBarSpy).toHaveBeenCalledWith('test error', undefined, SnackbarDefaults.defaultError)
  })

  it('displayWarning calls snackBar.open', () => {
    component.displayWarning('test warning')
    expect(snackBarSpy).toHaveBeenCalledWith('test warning', undefined, SnackbarDefaults.defaultWarn)
  })

  // ngOnDestroy()
  it('should set isDisconnecting to true on destroy', () => {
    component.isDisconnecting = false
    component.ngOnDestroy()
    expect(component.isDisconnecting).toBeTrue()
  })

  it('should not throw when timeInterval is not set on destroy', () => {
    ;(component as any).timeInterval = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})
