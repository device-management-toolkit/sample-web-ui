/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { Component, EventEmitter, Output, input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, RouterEvent, Router, RouterModule } from '@angular/router'
import { of, ReplaySubject, Subject, throwError } from 'rxjs'
import { KvmComponent } from './kvm.component'
import { DevicesService } from '../devices.service'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device } from '../../../models/models'
import { UserConsentService } from '../user-consent.service'
import { IDERComponent, KVMComponent } from '@device-management-toolkit/ui-toolkit-angular'
import { provideTranslateService } from '@ngx-translate/core'

describe('KvmComponent', () => {
  let component: KvmComponent
  let fixture: ComponentFixture<KvmComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: MockInstance
  let getPowerStateSpy: MockInstance
  let getPowerStateCachedSpy: MockInstance
  let getRedirectionStatusSpy: MockInstance
  let getAMTFeaturesSpy: MockInstance
  let getAMTFeaturesCachedSpy: MockInstance
  let sendPowerActionSpy: MockInstance
  let tokenSpy: MockInstance
  let getDisplaySelectionSpy: MockInstance
  let setDisplaySelectionSpy: MockInstance
  let snackBarSpy: MockInstance
  let router: Router
  let displayErrorSpy: MockInstance
  let displayWarningSpy: MockInstance
  let devicesService: SpyObj<DevicesService>
  let userConsentService: SpyObj<UserConsentService>

  const eventSubject = new ReplaySubject<RouterEvent>(1)

  beforeEach(async () => {
    devicesService = createSpyObj('DevicesService', [
      'sendPowerAction',
      'getDevice',
      'getPowerState',
      'getPowerStateCached',
      'setAmtFeatures',
      'getAMTFeatures',
      'getAMTFeaturesCached',
      'reqUserConsentCode',
      'cancelUserConsentCode',
      'getRedirectionExpirationToken',
      'getRedirectionStatus',
      'getDisplaySelection',
      'setDisplaySelection'
    ])
    userConsentService = createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])

    setAmtFeaturesSpy = devicesService.setAmtFeatures.mockReturnValue(
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
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
    )
    getAMTFeaturesSpy = devicesService.getAMTFeatures.mockReturnValue(
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
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
    )
    getAMTFeaturesCachedSpy = devicesService.getAMTFeaturesCached.mockReturnValue(
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
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
    )
    devicesService.getDevice.mockReturnValue(
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
    getRedirectionStatusSpy = devicesService.getRedirectionStatus.mockReturnValue(
      of({ isKVMConnected: false, isSOLConnected: false, isIDERConnected: false })
    )
    getPowerStateSpy = devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
    getPowerStateCachedSpy = devicesService.getPowerStateCached.mockReturnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.mockReturnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.mockReturnValue(of({ token: '123' }))
    getDisplaySelectionSpy = devicesService.getDisplaySelection.mockReturnValue(
      of({
        displays: [
          { displayIndex: 0, isActive: true, resolutionX: 1920, resolutionY: 1080, upperLeftX: 0, upperLeftY: 0 },
          { displayIndex: 1, isActive: false, resolutionX: 0, resolutionY: 0, upperLeftX: 0, upperLeftY: 0 }
        ]
      })
    )
    setDisplaySelectionSpy = devicesService.setDisplaySelection.mockReturnValue(of({ success: true }))
    userConsentService.handleUserConsentDecision.mockReturnValue(of(true))
    userConsentService.handleUserConsentResponse.mockReturnValue(of(true))

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
        KvmComponent
      ],
      providers: [
        provideTranslateService(),
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
    snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)
    vi.spyOn(router, 'navigate').mockImplementation((() => undefined) as any)

    displayErrorSpy = vi.spyOn(component, 'displayError')
    displayWarningSpy = vi.spyOn(component, 'displayWarning')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    fixture.detectChanges()
    expect(tokenSpy).toHaveBeenCalled()
    // init() reads power state and AMT features from the service cache so the
    // toolbar/general fetches are not duplicated when the user lands on the KVM tab.
    expect(getPowerStateCachedSpy).toHaveBeenCalled()
    expect(getAMTFeaturesCachedSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).not.toHaveBeenCalled()
    expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
    expect(getRedirectionStatusSpy).toHaveBeenCalled()
    // Display selection is deferred until the KVM session is actually connected
    // so it doesn't compete with the relay websocket upgrade on the MPS queue.
    expect(getDisplaySelectionSpy).not.toHaveBeenCalled()
  })
  it('loads displays once the KVM session reports connected (event=2)', () => {
    fixture.detectChanges()
    getDisplaySelectionSpy.mockClear()
    component.deviceKVMStatus(2)
    expect(getDisplaySelectionSpy).toHaveBeenCalledTimes(1)
    // Further connected events on the same session must not refetch
    component.deviceKVMStatus(2)
    expect(getDisplaySelectionSpy).toHaveBeenCalledTimes(1)
  })
  it('should have correct state on connect/disconnect methods', () => {
    // Initial state should be disconnected since we changed to signal(false)
    expect(component.deviceKVMConnection()).toBeFalsy()

    // Test connect method
    component.readyToLoadKvm = true
    component.connect()
    expect(component.isDisconnecting).toBeFalsy()
    expect(tokenSpy).toHaveBeenCalled()
    // After synchronous observables complete in test env, connection is re-established
    expect(component.deviceKVMConnection()).toBeTruthy()

    // Test disconnect method
    component.disconnect()
    expect(component.isDisconnecting).toBeTruthy()
    expect(component.deviceKVMConnection()).toBeFalsy()
  })
  it('connect() resets readyToLoadKvm and deviceKVMConnection to false before reconnecting', () => {
    component.readyToLoadKvm = true
    component.deviceKVMConnection.set(true)
    // Intercept init to observe intermediate reset state
    let readyToLoadKvmAtStartOfInit = true
    let connectionAtStartOfInit = true
    vi.spyOn(component, 'init').mockImplementation(() => {
      readyToLoadKvmAtStartOfInit = component.readyToLoadKvm
      connectionAtStartOfInit = component.deviceKVMConnection()
    })
    component.connect()
    expect(readyToLoadKvmAtStartOfInit).toBe(false)
    expect(connectionAtStartOfInit).toBe(false)
  })
  it('connect() prefetches the auth token in parallel with init() for a reconnect', () => {
    tokenSpy.mockClear()
    const initSpy = vi.spyOn(component, 'init').mockImplementation(() => undefined)
    component.connect()
    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(tokenSpy).toHaveBeenCalledTimes(1)
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting = true
    component.deviceKVMStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(0)
  })
  it('should show error and hide loading when isDisconnecting is false', () => {
    component.isDisconnecting = false
    component.deviceKVMConnection.set(true)
    component.deviceKVMStatus(0)
    expect(snackBarSpy).toHaveBeenCalledExactlyOnceWith(
      'kvm.sessionClosedByDevice.value',
      undefined,
      SnackbarDefaults.defaultWarn
    )
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(0)
    // AMT dropped the connection — deviceKVMConnection must be reset so Connect button appears
    expect(component.deviceKVMConnection()).toBe(false)
  })
  it('should not reset deviceKVMConnection when isDisconnecting is true (intentional disconnect)', () => {
    component.isDisconnecting = true
    component.deviceKVMConnection.set(true)
    component.deviceKVMStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    // intentional disconnect — caller manages connection state via disconnect()
    expect(component.deviceKVMConnection()).toBe(true)
  })
  it('should hide loading when connected', () => {
    component.deviceKVMStatus(2)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(2)
  })
  it('should clear loading status when connected', () => {
    component.loadingStatus.set('kvm.status.connectingKVM.value')
    component.isLoading.set(true)
    component.deviceKVMStatus(2)
    expect(component.loadingStatus()).toBe('')
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(2)
  })
  it('should clear loading status on disconnect', () => {
    component.loadingStatus.set('kvm.status.connectingKVM.value')
    component.isLoading.set(true)
    component.isDisconnecting = true
    component.deviceKVMStatus(0)
    expect(component.loadingStatus()).toBe('')
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(0)
  })
  it('should set loading status when initiating connection', async () => {
    await new Promise<void>((done) => {
      component.postUserConsentDecision(true).subscribe(() => {
        expect(component.loadingStatus()).toBe('kvm.status.connectingKVM.value')
        expect(component.deviceKVMConnection()).toBe(true)
        done()
      })
    })
  })
  it('refreshes the auth token before initiating connection (prevents stale-token after consent dialog)', async () => {
    await new Promise<void>((done) => {
      tokenSpy.mockClear()
      tokenSpy.mockReturnValue(of({ token: 'post-consent-token' }))
      component.authToken.set('stale')
      component.postUserConsentDecision(true).subscribe(() => {
        expect(tokenSpy).toHaveBeenCalledWith('')
        expect(component.authToken()).toBe('post-consent-token')
        expect(component.deviceKVMConnection()).toBe(true)
        done()
      })
    })
  })
  it('skips the token refresh when init() completed fast (no blocking dialog)', async () => {
    await new Promise<void>((done) => {
      tokenSpy.mockClear()
      component.authToken.set('prefetched-token')
      ;(component as any).initStartTime = Date.now()
      component.postUserConsentDecision(true).subscribe(() => {
        expect(tokenSpy).not.toHaveBeenCalled()
        expect(component.authToken()).toBe('prefetched-token')
        expect(component.deviceKVMConnection()).toBe(true)
        expect(component.loadingStatus()).toBe('kvm.status.connectingKVM.value')
        done()
      })
    })
  })
  it('does not refresh the auth token when consent is denied', async () => {
    await new Promise<void>((done) => {
      tokenSpy.mockClear()
      component.authToken.set('untouched')
      component.postUserConsentDecision(false).subscribe(() => {
        expect(tokenSpy).not.toHaveBeenCalled()
        expect(component.authToken()).toBe('untouched')
        done()
      })
    })
  })
  it('should clear loading status when consent is denied', async () => {
    await new Promise<void>((done) => {
      component.loadingStatus.set('kvm.status.checkingAMTFeatures.value')
      component.postUserConsentDecision(false).subscribe(() => {
        expect(component.loadingStatus()).toBe('')
        expect(component.isLoading()).toBe(false)
        expect(component.deviceState()).toBe(0)
        done()
      })
    })
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
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.showPowerUpAlert()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('enable KVM dialog', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
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
  it('getAMTFeatures', async () => {
    await new Promise<void>((done) => {
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
            rpeSupported: true,
            rpe: true,
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
  })
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
  it('postUserConsentDecision does not issue a duplicate AMT features fetch', async () => {
    await new Promise<void>((done) => {
      getAMTFeaturesSpy.mockClear()
      getAMTFeaturesCachedSpy.mockClear()
      component.postUserConsentDecision(true).subscribe(() => {
        expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
        expect(getAMTFeaturesCachedSpy).not.toHaveBeenCalled()
        done()
      })
    })
  })
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
          done()
        }
      })
    })
  })
  it('should set redirectionStatus correctly when handling redirection status', () => {
    const mockRedirectionStatus = { isKVMConnected: false, isSOLConnected: false, isIDERConnected: false }
    component.handleRedirectionStatus(mockRedirectionStatus).subscribe(() => {
      expect(component.redirectionStatus).toEqual(mockRedirectionStatus)
    })
  })
  it('should set redirectionStatus correctly and return null when handling redirection status', async () => {
    await new Promise<void>((done) => {
      const mockRedirectionStatus = { isKVMConnected: true, isSOLConnected: false, isIDERConnected: false }
      component.handleRedirectionStatus(mockRedirectionStatus).subscribe(() => {
        expect(component.redirectionStatus).toEqual(mockRedirectionStatus)
        done()
      })
    })
  })
  it('getPowerState', async () => {
    component.getPowerState('111')
    expect(getPowerStateSpy).toHaveBeenCalled()
  })
  it('getPowerStateCached delegates to the service cache variant', async () => {
    getPowerStateSpy.mockClear()
    getPowerStateCachedSpy.mockClear()
    component.getPowerStateCached('111').subscribe()
    expect(getPowerStateCachedSpy).toHaveBeenCalledWith('111')
    expect(getPowerStateSpy).not.toHaveBeenCalled()
  })
  it('getPowerState error', async () => {
    await new Promise<void>((done) => {
      component.isLoading.set(true)
      getPowerStateSpy = devicesService.getPowerState.mockReturnValue(throwError(() => new Error('err')))
      component.getPowerState('111').subscribe({
        error: () => {
          expect(getPowerStateSpy).toHaveBeenCalled()
          expect(displayErrorSpy).toHaveBeenCalled()
          done()
        }
      })
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
      rpeSupported: true,
      rpe: true,
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
  it('should set loading status when checking consent', () => {
    component.loadingStatus.set('kvm.status.checkingConsent.value')
    expect(component.loadingStatus()).toBe('kvm.status.checkingConsent.value')
  })
  it('should maintain loading status through consent check', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({
        userConsent: 'none',
        KVM: true,
        SOL: true,
        IDER: true,
        redirection: true,
        kvmAvailable: true,
        optInState: 3,
        httpsBootSupported: true,
        ocr: true,
        winREBootSupported: true,
        localPBABootSupported: true,
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
      component.loadingStatus.set('kvm.status.checkingConsent.value')
      component.isLoading.set(true)
      component.checkUserConsent().subscribe(() => {
        expect(component.isLoading()).toBe(true)
        expect(component.readyToLoadKvm).toBe(true)
        done()
      })
    })
  })
  it('handlePowerState 2', async () => {
    await new Promise<void>((done) => {
      component.handlePowerState({ powerstate: 2 }).subscribe((results) => {
        expect(results).toEqual(true)
        done()
      })
    })
  })
  it('handlePowerState 0', async () => {
    await new Promise<void>((done) => {
      vi.spyOn(component, 'showPowerUpAlert').mockReturnValue(of(true))
      component.handlePowerState({ powerstate: 0 }).subscribe({
        next: (results) => {
          expect(sendPowerActionSpy).toHaveBeenCalled()
          expect(results).toEqual({})
          done()
        }
      })
    })
  })
  it('handleAMTFeatureResponse KVM already enabled', async () => {
    await new Promise<void>((done) => {
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
        rpeSupported: true,
        rpe: true,
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
  })
  it('handleAMTFeatureResponse enableKvmDialog error', async () => {
    await new Promise<void>((done) => {
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
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
      vi.spyOn(component, 'enableKvmDialog').mockReturnValue(throwError(() => new Error('err')))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        error: () => {
          expect(displayErrorSpy).toHaveBeenCalled()
          done()
        }
      })
    })
  })
  it('handleAMTFeatureResponse cancel enableSol', async () => {
    const cancelEnableSolResponseSpy = vi
      .spyOn(component, 'cancelEnableKvmResponse')
      .mockImplementation(() => undefined)
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
      rpeSupported: true,
      rpe: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    })
    vi.spyOn(component, 'enableKvmDialog').mockReturnValue(of(false))
    component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
      next: (results) => {
        expect(cancelEnableSolResponseSpy).toHaveBeenCalled()
        expect(results).toEqual(false)
      }
    })
  })
  it('handleAMTFeatureResponse enableSol', async () => {
    await new Promise<void>((done) => {
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
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
      vi.spyOn(component, 'enableKvmDialog').mockReturnValue(of(true))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        next: () => {
          expect(setAmtFeaturesSpy).toHaveBeenCalled()
          done()
        }
      })
    })
  })
  it('handleAMTFeatureResponse should show enable dialog when redirection is false', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({
        userConsent: 'none',
        KVM: true,
        SOL: true,
        IDER: true,
        redirection: false,
        kvmAvailable: true,
        optInState: 0,
        httpsBootSupported: true,
        ocr: true,
        winREBootSupported: true,
        localPBABootSupported: true,
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
      vi.spyOn(component, 'enableKvmDialog').mockReturnValue(of(true))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        next: () => {
          expect(setAmtFeaturesSpy).toHaveBeenCalled()
          done()
        }
      })
    })
  })
  it('handleAMTFeatureResponse should show enable dialog when both redirection and KVM are false', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({
        userConsent: 'none',
        KVM: false,
        SOL: true,
        IDER: true,
        redirection: false,
        kvmAvailable: true,
        optInState: 0,
        httpsBootSupported: true,
        ocr: true,
        winREBootSupported: true,
        localPBABootSupported: true,
        rpeSupported: true,
        rpe: true,
        pbaBootFilesPath: [],
        winREBootFilesPath: {
          instanceID: '',
          biosBootString: '',
          bootString: ''
        }
      })
      vi.spyOn(component, 'enableKvmDialog').mockReturnValue(of(true))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        next: () => {
          expect(setAmtFeaturesSpy).toHaveBeenCalled()
          done()
        }
      })
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
    expect(displayWarningSpy).toHaveBeenCalled()
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
    expect(component.isIDERActive()).toBe(false)
  })
  it('should set isIDERActive to true when event is 3', () => {
    component.deviceIDERStatus(3)
    expect(component.isIDERActive()).toBe(true)
  })
  it('should not change isIDERActive for other event values', () => {
    component.deviceIDERStatus(1)
    expect(component.isIDERActive()).toBe(false)
  })
  it('should set diskImage and emit true on file selection', () => {
    const mockFile = new File([''], 'test-file.txt', { type: 'text/plain' })
    const mockEvt = { target: { files: [mockFile] } } as unknown as Event

    const deviceIDERConnectionSpy = vi.spyOn(component.deviceIDERConnection, 'set').mockImplementation(() => undefined)
    component.onFileSelected(mockEvt)

    expect(component.diskImage).toEqual(mockFile)
    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(true)
  })
  it('should emit false on canceling IDER', () => {
    const deviceIDERConnectionSpy = vi.spyOn(component.deviceIDERConnection, 'set').mockImplementation(() => undefined)
    const mockFileInput = { value: 'some-file.iso' } as HTMLInputElement
    component.onCancelIDER(mockFileInput)

    expect(deviceIDERConnectionSpy).toHaveBeenCalledWith(false)
    expect(mockFileInput.value).toBe('')
  })

  // Hot Key tests
  it('should send hotkey when sendHotkey is called with selectedHotkey', () => {
    const hotKeySignalSpy = vi.spyOn(component.hotKeySignal, 'set').mockImplementation(() => undefined)
    component.selectedHotkey = 'ctrl-alt-del'

    component.sendHotkey()

    expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-del')
  })

  it('should not send hotkey when sendHotkey is called without selectedHotkey', () => {
    const hotKeySignalSpy = vi.spyOn(component.hotKeySignal, 'set').mockImplementation(() => undefined)
    component.selectedHotkey = null

    component.sendHotkey()

    expect(hotKeySignalSpy).not.toHaveBeenCalled()
  })

  it('should reset hotkey signal after timeout', async () => {
    await new Promise<void>((done) => {
      const hotKeySignalSpy = vi.spyOn(component.hotKeySignal, 'set').mockImplementation(() => undefined)
      component.selectedHotkey = 'ctrl-alt-del'

      component.sendHotkey()

      expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-del')

      setTimeout(() => {
        expect(hotKeySignalSpy).toHaveBeenCalledWith(null)
        done()
      }, 150)
    })
  })

  it('should have all Alt + Function keys (F1-F12) in hotKeys array', () => {
    const altFKeys = [
      'alt-f1',
      'alt-f2',
      'alt-f3',
      'alt-f4',
      'alt-f5',
      'alt-f6',
      'alt-f7',
      'alt-f8',
      'alt-f9',
      'alt-f10',
      'alt-f11',
      'alt-f12'
    ]

    altFKeys.forEach((key) => {
      const found = component.hotKeys.find((hotkey) => hotkey.value === key)
      expect(found).toBeDefined()
      expect(found?.label).toContain('Alt + F')
    })
  })

  it('should have all Ctrl + Alt + Function keys (F1-F12) in hotKeys array', () => {
    const ctrlAltFKeys = [
      'ctrl-alt-f1',
      'ctrl-alt-f2',
      'ctrl-alt-f3',
      'ctrl-alt-f4',
      'ctrl-alt-f5',
      'ctrl-alt-f6',
      'ctrl-alt-f7',
      'ctrl-alt-f8',
      'ctrl-alt-f9',
      'ctrl-alt-f10',
      'ctrl-alt-f11',
      'ctrl-alt-f12'
    ]

    ctrlAltFKeys.forEach((key) => {
      const found = component.hotKeys.find((hotkey) => hotkey.value === key)
      expect(found).toBeDefined()
      expect(found?.label).toContain('Ctrl + Alt + F')
    })
  })

  it('should send Alt + F4 hotkey correctly', () => {
    const hotKeySignalSpy = vi.spyOn(component.hotKeySignal, 'set').mockImplementation(() => undefined)
    component.selectedHotkey = 'alt-f4'

    component.sendHotkey()

    expect(hotKeySignalSpy).toHaveBeenCalledWith('alt-f4')
  })

  it('should send Ctrl + Alt + F5 hotkey correctly', () => {
    const hotKeySignalSpy = vi.spyOn(component.hotKeySignal, 'set').mockImplementation(() => undefined)
    component.selectedHotkey = 'ctrl-alt-f5'

    component.sendHotkey()

    expect(hotKeySignalSpy).toHaveBeenCalledWith('ctrl-alt-f5')
  })

  // Keyboard event handling tests
  describe('Keyboard Event Handling', () => {
    let createdElements: HTMLElement[] = []

    beforeEach(() => {
      // Trigger component initialization which adds event listeners in ngOnInit
      fixture.detectChanges()
      createdElements = []
    })

    afterEach(() => {
      // Clean up only the elements we created
      createdElements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el)
        }
      })
      createdElements = []
    })

    it('should stop immediate propagation when input field has focus and KVM is connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const inputElement = document.createElement('input')
        document.body.appendChild(inputElement)
        createdElements.push(inputElement)
        inputElement.focus()

        let captureHandlerCalled = false
        const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })

        // Add a listener that should not be called if stopImmediatePropagation works
        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        inputElement.dispatchEvent(event)

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(false)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should stop immediate propagation when textarea has focus and KVM is connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const textareaElement = document.createElement('textarea')
        document.body.appendChild(textareaElement)
        createdElements.push(textareaElement)
        textareaElement.focus()

        let captureHandlerCalled = false
        const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })

        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        textareaElement.dispatchEvent(event)

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(false)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should allow propagation when no input element has focus and KVM is connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const divElement = document.createElement('div')
        divElement.setAttribute('tabindex', '0')
        document.body.appendChild(divElement)
        createdElements.push(divElement)
        divElement.focus()

        let captureHandlerCalled = false
        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        divElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }))

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(true)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should stop immediate propagation when select element has focus and KVM is connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const selectElement = document.createElement('select')
        const optionElement = document.createElement('option')
        optionElement.value = 'test'
        optionElement.text = 'Test'
        selectElement.appendChild(optionElement)
        document.body.appendChild(selectElement)
        createdElements.push(selectElement)
        selectElement.focus()

        let captureHandlerCalled = false
        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        selectElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(false)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should stop immediate propagation when contenteditable element has focus and KVM is connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const divElement = document.createElement('div')
        divElement.contentEditable = 'true'
        document.body.appendChild(divElement)
        createdElements.push(divElement)
        divElement.focus()

        let captureHandlerCalled = false
        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        divElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }))

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(false)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should stop immediate propagation for element inside mat-form-field when KVM is connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const matFormField = document.createElement('div')
        matFormField.classList.add('mat-form-field')
        const inputElement = document.createElement('input')
        matFormField.appendChild(inputElement)
        document.body.appendChild(matFormField)
        createdElements.push(matFormField)
        inputElement.focus()

        let captureHandlerCalled = false
        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }))

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(false)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should handle keyup and keypress events in addition to keydown', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(true)
        const inputElement = document.createElement('input')
        document.body.appendChild(inputElement)
        createdElements.push(inputElement)
        inputElement.focus()

        let keyupHandlerCalled = false
        let keypressHandlerCalled = false

        const keyupListener = () => {
          keyupHandlerCalled = true
        }
        const keypressListener = () => {
          keypressHandlerCalled = true
        }

        document.addEventListener('keyup', keyupListener, true)
        document.addEventListener('keypress', keypressListener, true)

        inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true, cancelable: true }))
        inputElement.dispatchEvent(new KeyboardEvent('keypress', { key: 'a', bubbles: true, cancelable: true }))

        setTimeout(() => {
          expect(keyupHandlerCalled).toBe(false)
          expect(keypressHandlerCalled).toBe(false)
          document.removeEventListener('keyup', keyupListener, true)
          document.removeEventListener('keypress', keypressListener, true)
          done()
        }, 50)
      })
    })

    it('should allow propagation when KVM is not connected', async () => {
      await new Promise<void>((done) => {
        component.deviceKVMConnection.set(false)
        const divElement = document.createElement('div')
        divElement.setAttribute('tabindex', '0')
        document.body.appendChild(divElement)
        createdElements.push(divElement)
        divElement.focus()

        let captureHandlerCalled = false
        const laterListener = () => {
          captureHandlerCalled = true
        }
        document.addEventListener('keydown', laterListener, true)

        divElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }))

        setTimeout(() => {
          expect(captureHandlerCalled).toBe(true)
          document.removeEventListener('keydown', laterListener, true)
          done()
        }, 50)
      })
    })

    it('should clean up event listeners on component destroy', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      component.ngOnDestroy()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function), true)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keypress', expect.any(Function), true)
    })
  })
})
