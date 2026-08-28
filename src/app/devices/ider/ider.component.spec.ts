/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
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
  let setAmtFeaturesSpy: MockInstance
  let getPowerStateSpy: MockInstance
  let getPowerStateCachedSpy: MockInstance
  let getRedirectionStatusSpy: MockInstance
  let getAMTFeaturesSpy: MockInstance
  let getAMTFeaturesCachedSpy: MockInstance
  let sendPowerActionSpy: MockInstance
  let tokenSpy: MockInstance
  let snackBarSpy: MockInstance
  let eventSubject: Subject<RouterEvent>
  let displayErrorSpy: MockInstance
  let displayWarningSpy: MockInstance
  let devicesService: SpyObj<DevicesService>
  let userConsentService: SpyObj<UserConsentService>
  let dialogSpy: SpyObj<MatDialog>

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
    rpe: false,
    rpeSupported: false,
    pbaBootFilesPath: [],
    winREBootFilesPath: {
      instanceID: '',
      biosBootString: '',
      bootString: ''
    }
  }

  beforeEach(async () => {
    eventSubject = new Subject<RouterEvent>()

    devicesService = createSpyObj('DevicesService', [
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
    userConsentService = createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])

    setAmtFeaturesSpy = devicesService.setAmtFeatures.mockReturnValue(of(amtFeaturesResponse))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.mockReturnValue(of(amtFeaturesResponse))
    getAMTFeaturesCachedSpy = devicesService.getAMTFeaturesCached.mockReturnValue(of(amtFeaturesResponse))
    getRedirectionStatusSpy = devicesService.getRedirectionStatus.mockReturnValue(
      of({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
    )
    getPowerStateSpy = devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
    getPowerStateCachedSpy = devicesService.getPowerStateCached.mockReturnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.mockReturnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.mockReturnValue(of({ token: '123' }))

    userConsentService.handleUserConsentDecision.mockReturnValue(of(true))
    userConsentService.handleUserConsentResponse.mockReturnValue(of(true))
    dialogSpy = createSpyObj('MatDialog', ['open'])
    dialogSpy.open.mockReturnValue(createSpyObj({ afterClosed: of(true), close: null }))

    devicesService.device = new Subject<Device>()
    devicesService.deviceState = new EventEmitter<number>()
    const websocketStub = {}
    authServiceStub = {}

    @Component({
      template: '',
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
          useValue: createSpyObj('Router', ['navigate'], { events: eventSubject.asObservable() })
        }
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(IderComponent)
    component = fixture.componentInstance
    snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)

    displayErrorSpy = vi.spyOn(component, 'displayError')
    displayWarningSpy = vi.spyOn(component, 'displayWarning')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    fixture.detectChanges()
    expect(tokenSpy).not.toHaveBeenCalled()
    expect(getPowerStateCachedSpy).not.toHaveBeenCalled()
    expect(getAMTFeaturesCachedSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).not.toHaveBeenCalled()
    expect(getAMTFeaturesCachedSpy).toHaveBeenCalled()
    expect(getRedirectionStatusSpy).not.toHaveBeenCalled()
  })

  it('prompts to enable IDER on tab load when IDER is disabled', () => {
    getAMTFeaturesCachedSpy.mockReturnValue(
      of({
        ...amtFeaturesResponse,
        IDER: false,
        redirection: true
      })
    )

    fixture.detectChanges()

    expect(dialogSpy.open).toHaveBeenCalled()
    expect(setAmtFeaturesSpy).toHaveBeenCalled()
  })

  it('should set isDisconnecting to true on NavigationStart event', () => {
    fixture.detectChanges()
    expect(component.isDisconnecting).toBe(false)
    eventSubject.next(new NavigationStart(1, '/some-route'))
    expect(component.isDisconnecting).toBe(true)
  })

  it('should not show error when NavigationStart triggers', () => {
    eventSubject.next(new NavigationStart(1, 'regular'))
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  // connect()
  it('should reset deviceState to -1 and call init on connect', () => {
    const initSpy = vi.spyOn(component, 'init').mockImplementation(() => undefined)
    component.deviceState.set(0)
    component.connect()
    expect(component.deviceState()).toBe(-1)
    expect(initSpy).toHaveBeenCalled()
  })

  it('connect() prefetches the auth token in parallel with init()', () => {
    tokenSpy.mockClear()
    const initSpy = vi.spyOn(component, 'init').mockImplementation(() => undefined)
    component.connect()
    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(tokenSpy).toHaveBeenCalledTimes(1)
  })

  // postUserConsentDecision()
  it('should set isLoading to false, loadingStatus to empty, and deviceState to 0 when result is false', async () => {
    await new Promise<void>((done) => {
      component.finalizeConnectionStart(false).subscribe(() => {
        expect(component.isLoading()).toBe(false)
        expect(component.loadingStatus()).toBe('')
        expect(component.deviceState()).toBe(0)
        done()
      })
    })
  })

  it('should return of(null) when result is false', async () => {
    await new Promise<void>((done) => {
      component.finalizeConnectionStart(false).subscribe((result) => {
        expect(result).toBeNull()
        done()
      })
    })
  })

  it('does not refresh the auth token when consent is denied', async () => {
    await new Promise<void>((done) => {
      tokenSpy.mockClear()
      component.authToken.set('untouched')
      component.finalizeConnectionStart(false).subscribe(() => {
        expect(tokenSpy).not.toHaveBeenCalled()
        expect(component.authToken()).toBe('untouched')
        done()
      })
    })
  })

  it('refreshes the auth token before completing when result is true', async () => {
    await new Promise<void>((done) => {
      tokenSpy.mockClear()
      tokenSpy.mockReturnValue(of({ token: 'post-consent-token' }))
      component.authToken.set('stale')
      component.finalizeConnectionStart(true).subscribe(() => {
        expect(tokenSpy).toHaveBeenCalled()
        expect(component.authToken()).toBe('post-consent-token')
        done()
      })
    })
  })

  it('postUserConsentDecision short-circuits when file selection was canceled', async () => {
    await new Promise<void>((done) => {
      tokenSpy.mockClear()
      ;(component as any).diskSelectionCanceled = true
      component.isLoading.set(true)
      component.loadingStatus.set('ider.status.connectingIder.value')

      component.finalizeConnectionStart(true).subscribe((result) => {
        expect(result).toBeNull()
        expect(component.isLoading()).toBe(false)
        expect(component.loadingStatus()).toBe('')
        expect(tokenSpy).not.toHaveBeenCalled()
        expect((component as any).diskSelectionCanceled).toBe(false)
        done()
      })
    })
  })

  it('init skips consent handlers when cached consent is already satisfied', () => {
    tokenSpy.mockClear()
    component.connect()
    expect(component.loadingStatus()).toBe('ider.status.connectingIder.value')
    expect(userConsentService.handleUserConsentDecision).not.toHaveBeenCalled()
    expect(userConsentService.handleUserConsentResponse).not.toHaveBeenCalled()
    expect(tokenSpy.mock.calls.length).toBe(1)
  })

  it('init stops before consent handlers when enabling IDER is declined', () => {
    tokenSpy.mockClear()
    userConsentService.handleUserConsentDecision.mockClear()
    userConsentService.handleUserConsentResponse.mockClear()
    vi.spyOn(component, 'handleAMTFeaturesResponse').mockReturnValue(of(false))

    component.connect()

    expect(userConsentService.handleUserConsentDecision).not.toHaveBeenCalled()
    expect(userConsentService.handleUserConsentResponse).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(false)
    expect(component.loadingStatus()).toBe('')
    expect(tokenSpy.mock.calls.length).toBe(1)
  })

  it('postUserConsentDecision does not issue a duplicate AMT features fetch', async () => {
    await new Promise<void>((done) => {
      getAMTFeaturesSpy.mockClear()
      getAMTFeaturesCachedSpy.mockClear()
      component.finalizeConnectionStart(true).subscribe(() => {
        expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
        expect(getAMTFeaturesCachedSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  // checkUserConsent()
  it('checkUserConsent returns true when userConsent is none', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'none' })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBe(true)
        done()
      })
    })
  })

  it('checkUserConsent returns true when optInState is 3', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 3 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBe(true)
        done()
      })
    })
  })

  it('checkUserConsent returns true when optInState is 4', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 4 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBe(true)
        done()
      })
    })
  })

  it('checkUserConsent returns false when userConsent is not none and optInState is not 3 or 4', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 0 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBe(false)
        done()
      })
    })
  })

  it('checkUserConsent returns false when amtFeatures is null', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set(null)
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBe(false)
        done()
      })
    })
  })

  it('checkUserConsent returns false when consentReady is stale and AMT state requires consent', async () => {
    await new Promise<void>((done) => {
      ;(component as any).consentReady = true
      component.amtFeatures.set({ ...amtFeaturesResponse, userConsent: 'ider', optInState: 0 })
      component.checkUserConsent().subscribe((result) => {
        expect(result).toBe(false)
        expect((component as any).consentReady).toBe(false)
        done()
      })
    })
  })

  // handlePowerState()
  it('handlePowerState returns true when device is powered on (powerstate 2)', async () => {
    await new Promise<void>((done) => {
      component.handlePowerState({ powerstate: 2 }).subscribe((result) => {
        expect(result).toBe(true)
        done()
      })
    })
  })

  it('handlePowerState shows power up alert when device is not powered on', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.mockReturnValue(dialogRefSpyObj)
    component.handlePowerState({ powerstate: 0 }).subscribe()
    expect(dialogSpy.open).toHaveBeenCalled()
  })

  it('handlePowerState calls sendPowerAction when user confirms power up', async () => {
    await new Promise<void>((done) => {
      vi.spyOn(component, 'showPowerUpAlert').mockReturnValue(of(true))
      component.handlePowerState({ powerstate: 0 }).subscribe(() => {
        expect(sendPowerActionSpy).toHaveBeenCalledWith(component.deviceId(), 2)
        done()
      })
    })
  })

  it('handlePowerState returns null when user declines power up', async () => {
    await new Promise<void>((done) => {
      vi.spyOn(component, 'showPowerUpAlert').mockReturnValue(of(false))
      component.handlePowerState({ powerstate: 0 }).subscribe((result) => {
        expect(result).toBeNull()
        expect(sendPowerActionSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  // getRedirectionStatus()
  it('should call getRedirectionStatus and return expected data', async () => {
    await new Promise<void>((done) => {
      component.getRedirectionStatus('test-guid').subscribe((response) => {
        expect(devicesService.getRedirectionStatus).toHaveBeenCalledWith('test-guid')
        expect(response).toEqual({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
        done()
      })
    })
  })

  it('getRedirectionStatus error', async () => {
    await new Promise<void>((done) => {
      component.isLoading.set(true)
      getRedirectionStatusSpy = devicesService.getRedirectionStatus.mockReturnValue(throwError(() => new Error('err')))
      component.getRedirectionStatus('test-guid').subscribe({
        error: () => {
          expect(getRedirectionStatusSpy).toHaveBeenCalled()
          expect(displayErrorSpy).toHaveBeenCalled()
          devicesService.getRedirectionStatus.mockReturnValue(
            of({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
          )
          done()
        }
      })
    })
  })

  it('should set redirectionStatus and return true when IDER is not connected', async () => {
    await new Promise<void>((done) => {
      const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: false }
      component.amtFeatures.set({ ...amtFeaturesResponse, IDER: true })
      component.handleRedirectionStatus(mockRedirectionStatus).subscribe((result) => {
        expect(component.redirectionStatus).toEqual(mockRedirectionStatus)
        expect(result).toBe(true)
        done()
      })
    })
  })

  it('should return null and display error when IDER is already connected', async () => {
    await new Promise<void>((done) => {
      const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: true }
      component.amtFeatures.set({ ...amtFeaturesResponse, IDER: true })
      component.handleRedirectionStatus(mockRedirectionStatus).subscribe((result) => {
        expect(result).toBeNull()
        expect(displayWarningSpy).toHaveBeenCalled()
        expect(displayErrorSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  it('should return null when IDER is connected even if AMT IDER feature is false', async () => {
    await new Promise<void>((done) => {
      const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: true }
      component.amtFeatures.set({ ...amtFeaturesResponse, IDER: false })
      component.handleRedirectionStatus(mockRedirectionStatus).subscribe((result) => {
        expect(result).toBeNull()
        expect(displayWarningSpy).toHaveBeenCalled()
        expect(displayErrorSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  // getPowerState()
  it('getPowerState calls devicesService.getPowerState', () => {
    component.getPowerState('111')
    expect(getPowerStateSpy).toHaveBeenCalledWith('111')
  })

  it('getPowerState error', async () => {
    await new Promise<void>((done) => {
      component.isLoading.set(true)
      getPowerStateSpy = devicesService.getPowerState.mockReturnValue(throwError(() => new Error('err')))
      component.getPowerState('111').subscribe({
        error: () => {
          expect(getPowerStateSpy).toHaveBeenCalled()
          expect(displayErrorSpy).toHaveBeenCalled()
          devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
          done()
        }
      })
    })
  })

  // getPowerStateCached()
  it('getPowerStateCached delegates to the service cache variant', () => {
    getPowerStateSpy.mockClear()
    getPowerStateCachedSpy.mockClear()
    component.getPowerStateCached('111').subscribe()
    expect(getPowerStateCachedSpy).toHaveBeenCalledWith('111')
    expect(getPowerStateSpy).not.toHaveBeenCalled()
  })

  // getAMTFeatures()
  it('getAMTFeatures sets isLoading to true and calls service', async () => {
    await new Promise<void>((done) => {
      component.isLoading.set(false)
      component.getAMTFeatures().subscribe((result) => {
        expect(getAMTFeaturesSpy).toHaveBeenCalled()
        expect(result).toEqual(amtFeaturesResponse)
        expect(component.isLoading()).toBe(true)
        done()
      })
    })
  })

  // getAMTFeaturesCached()
  it('getAMTFeaturesCached delegates to the service cache variant', async () => {
    await new Promise<void>((done) => {
      component.getAMTFeaturesCached().subscribe(() => {
        expect(getAMTFeaturesCachedSpy).toHaveBeenCalledWith('')
        expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
        expect(component.isLoading()).toBe(true)
        done()
      })
    })
  })

  // handleAMTFeaturesResponse()
  it('handleAMTFeaturesResponse sets amtFeatures and skips setAmtFeatures when IDER is already connected', async () => {
    await new Promise<void>((done) => {
      component.handleAMTFeaturesResponse(amtFeaturesResponse as any).subscribe(() => {
        expect(component.amtFeatures()).toEqual(amtFeaturesResponse as any)
        expect(setAmtFeaturesSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })

  it('handleAMTFeaturesResponse uses default values when AMT features properties are undefined', async () => {
    await new Promise<void>((done) => {
      const partialFeatures = { userConsent: undefined } as any
      component.handleAMTFeaturesResponse(partialFeatures).subscribe(() => {
        expect(setAmtFeaturesSpy).toHaveBeenCalledWith(
          component.deviceId(),
          expect.objectContaining({
            userConsent: '',
            enableSOL: false,
            enableIDER: true,
            ocr: false,
            enableKVM: false,
            rpe: false
          })
        )
        done()
      })
    })
  })

  // showPowerUpAlert()
  it('power up alert dialog', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    dialogSpy.open.mockReturnValue(dialogRefSpyObj)
    component.showPowerUpAlert()
    expect(dialogSpy.open).toHaveBeenCalled()
  })

  // onFileSelected()
  it('should set diskImage and start connection on file selection', () => {
    const mockFile = new File([''], 'test-file.iso', { type: 'application/octet-stream' })
    const mockEvt = { target: { files: [mockFile] } } as unknown as Event
    const deviceIDERConnectionSpy = vi.spyOn(component.deviceIDERConnection, 'set').mockImplementation(() => undefined)
    const connectSpy = vi.spyOn(component, 'connect').mockImplementation(() => undefined)

    component.onFileSelected(mockEvt)

    expect(component.diskImage).toEqual(mockFile)
    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(false)
    expect(connectSpy).toHaveBeenCalled()
  })

  it('should set diskImage to null when no file is selected', () => {
    const mockEvt = { target: { files: [] } } as unknown as Event
    component.onFileSelected(mockEvt)
    expect(component.diskImage).toBeNull()
  })

  it('onAttachDiskImage starts connection and opens file picker', () => {
    const mockFileInput = createSpyObj('HTMLInputElement', ['click']) as HTMLInputElement
    mockFileInput.value = 'existing.iso'

    component.onAttachDiskImage(mockFileInput)

    expect(mockFileInput.value).toBe('')
    expect(mockFileInput.click).toHaveBeenCalled()
  })

  it('onFileSelected does not start connection when a file is selected during active attach flow', () => {
    const connectSpy = vi.spyOn(component, 'connect').mockImplementation(() => undefined)
    const mockFile = new File([''], 'test-file.iso', { type: 'application/octet-stream' })
    const mockEvt = { target: { files: [mockFile] } } as unknown as Event
    component.isLoading.set(true)

    component.onFileSelected(mockEvt)

    expect(connectSpy).not.toHaveBeenCalled()
  })

  it('onFileSelected does not start connection when file selection is canceled', () => {
    const connectSpy = vi.spyOn(component, 'connect').mockImplementation(() => undefined)
    component.isLoading.set(true)
    component.loadingStatus.set('ider.status.connectingIder.value')
    const mockEvt = { target: { files: [] } } as unknown as Event

    component.onFileSelected(mockEvt)

    expect(component.diskImage).toBeNull()
    expect(component.deviceIDERConnection()).toBe(false)
    expect(component.isLoading()).toBe(false)
    expect(component.loadingStatus()).toBe('')
    expect(connectSpy).not.toHaveBeenCalled()
  })

  it('onAttachDiskImage ignores clicks while loading', () => {
    const connectSpy = vi.spyOn(component, 'connect').mockImplementation(() => undefined)
    const mockFileInput = createSpyObj('HTMLInputElement', ['click']) as HTMLInputElement
    component.isLoading.set(true)

    component.onAttachDiskImage(mockFileInput)

    expect(connectSpy).not.toHaveBeenCalled()
    expect(mockFileInput.click).not.toHaveBeenCalled()
  })

  it('onAttachDiskImage warns and does not reconnect when IDER is already active', () => {
    const connectSpy = vi.spyOn(component, 'connect').mockImplementation(() => undefined)
    const mockFileInput = createSpyObj('HTMLInputElement', ['click']) as HTMLInputElement
    component.isIDERActive.set(true)

    component.onAttachDiskImage(mockFileInput)

    expect(displayWarningSpy).toHaveBeenCalledWith('ider.alreadyActiveWarning.value')
    expect(connectSpy).not.toHaveBeenCalled()
    expect(mockFileInput.click).not.toHaveBeenCalled()
  })

  it('onAttachDiskImage clears loading when picker closes without selecting a file', () => {
    const mockFileInput = createSpyObj('HTMLInputElement', ['click']) as HTMLInputElement

    component.onAttachDiskImage(mockFileInput)
    component.isLoading.set(true)
    component.loadingStatus.set('ider.status.connectingIder.value')

    window.dispatchEvent(new Event('focus'))

    expect(component.diskImage).toBeNull()
    expect(component.isLoading()).toBe(false)
    expect(component.loadingStatus()).toBe('')
  })

  it('disables the Attach button when IDER is already active', () => {
    component.isIDERActive.set(true)
    fixture.detectChanges()

    const attachButton = fixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement

    expect(attachButton.disabled).toBe(true)
  })

  // onCancelIDER()
  it('should set deviceIDERConnection to false on cancel IDER', () => {
    const deviceIDERConnectionSpy = vi.spyOn(component.deviceIDERConnection, 'set').mockImplementation(() => undefined)
    const mockFileInput = { value: 'some-file.iso' } as HTMLInputElement
    component.onCancelIDER(mockFileInput)
    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(false)
  })

  it('should clear loading state on cancel IDER', () => {
    component.isLoading.set(true)
    component.loadingStatus.set('ider.status.connectingIder.value')
    const mockFileInput = { value: 'some-file.iso' } as HTMLInputElement

    component.onCancelIDER(mockFileInput)

    expect(component.isLoading()).toBe(false)
    expect(component.loadingStatus()).toBe('')
  })

  it('should clear file input value on cancel IDER', () => {
    const mockFileInput = document.createElement('input') as HTMLInputElement
    mockFileInput.id = 'file'
    document.body.appendChild(mockFileInput)

    component.onCancelIDER(mockFileInput)
    expect(mockFileInput.value).toBe('')

    document.body.removeChild(mockFileInput)
  })

  it('should not throw when file input element does not exist on cancel IDER', () => {
    const mockFileInput = { value: 'some-file.iso' } as HTMLInputElement
    expect(() => component.onCancelIDER(mockFileInput)).not.toThrow()
  })

  // deviceIDERStatus()
  it('should set isIDERActive to false when event is 0', () => {
    component.isIDERActive.set(true)
    component.deviceIDERStatus(0)
    expect(component.isIDERActive()).toBe(false)
  })

  it('should display warning with iderEnded key when event is 0', () => {
    component.deviceIDERStatus(0)
    expect(displayWarningSpy).toHaveBeenCalled()
  })

  it('should set isIDERActive to true when event is 3', () => {
    component.isIDERActive.set(false)
    component.deviceIDERStatus(3)
    expect(component.isIDERActive()).toBe(true)
  })

  it('should display warning with iderActive key when event is 3', () => {
    component.deviceIDERStatus(3)
    expect(displayWarningSpy).toHaveBeenCalled()
  })

  it('should not change isIDERActive for other event values', () => {
    component.isIDERActive.set(false)
    component.deviceIDERStatus(1)
    expect(component.isIDERActive()).toBe(false)
    expect(snackBarSpy).not.toHaveBeenCalled()
  })

  // onIderData() / live transfer stats
  it('onIderData stores stats and marks the session as transferring', () => {
    component.onIderData({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
    expect(component.iderData()).toEqual({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
    expect(component.isTransferring()).toBe(true)
    expect(component.bytesTransferred()).toBe(2048)
  })

  it('bytesTransferred sums cdrom and floppy read/write', () => {
    component.onIderData({ cdromRead: 2048, cdromWrite: 1024, floppyRead: 512, floppyWrite: 512 })
    expect(component.bytesTransferred()).toBe(4096)
  })

  it('bytesTransferred is 0 when no data has been received', () => {
    expect(component.iderData()).toBeNull()
    expect(component.bytesTransferred()).toBe(0)
  })

  it('isTransferring clears after the idle timeout but stats remain visible', () => {
    vi.useFakeTimers()
    try {
      component.onIderData({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
      expect(component.isTransferring()).toBe(true)
      vi.advanceTimersByTime(1500)
      expect(component.isTransferring()).toBe(false)
      expect(component.bytesTransferred()).toBe(2048)
    } finally {
      vi.useRealTimers()
    }
  })

  it('deviceIDERStatus(0) resets the live transfer stats', () => {
    component.onIderData({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
    component.deviceIDERStatus(0)
    expect(component.iderData()).toBeNull()
    expect(component.isTransferring()).toBe(false)
  })

  it('onCancelIDER resets the live transfer stats', () => {
    const mockFileInput = { value: 'some-file.iso' } as HTMLInputElement
    component.onIderData({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
    component.onCancelIDER(mockFileInput)
    expect(component.iderData()).toBeNull()
    expect(component.isTransferring()).toBe(false)
  })

  it('clears the transfer idle timer on destroy so no callback fires afterwards', () => {
    vi.useFakeTimers()
    try {
      component.onIderData({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
      component.ngOnDestroy()
      vi.advanceTimersByTime(1500)
      // Timer was cancelled, so isTransferring is left untouched (not reset by a late callback)
      expect(component.isTransferring()).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders the shared IDER status strip with transferred bytes when IDER is active', () => {
    component.isIDERActive.set(true)
    component.onIderData({ cdromRead: 2048, cdromWrite: 0, floppyRead: 0, floppyWrite: 0 })
    fixture.detectChanges()
    const strip = fixture.nativeElement.querySelector('app-ider-status')
    expect(strip).toBeTruthy()
    expect(strip.textContent).toContain('2.0 KB')
  })

  it('shows the ISM note only on ISM systems', () => {
    fixture.componentRef.setInput('isISM', true)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('ider.ism.info.value')

    fixture.componentRef.setInput('isISM', false)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('ider.ism.info.value')
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
    expect(component.isDisconnecting).toBe(true)
  })

  it('should not throw when timeInterval is not set on destroy', () => {
    ;(component as any).timeInterval = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})
