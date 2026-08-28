/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { Component, EventEmitter, Output, signal, input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, Router, RouterEvent, RouterModule } from '@angular/router'
import { of, ReplaySubject, Subject, throwError } from 'rxjs'
import { SolComponent } from './sol.component'
import { DevicesService } from '../devices.service'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device } from '../../../models/models'
import { UserConsentService } from '../user-consent.service'
import { provideTranslateService } from '@ngx-translate/core'

describe('SolComponent', () => {
  let component: SolComponent
  let fixture: ComponentFixture<SolComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: MockInstance
  let getPowerStateSpy: MockInstance
  let getAMTFeaturesSpy: MockInstance
  let sendPowerActionSpy: MockInstance
  let tokenSpy: MockInstance
  let snackBarSpy: MockInstance
  let router: Router
  let displayErrorSpy: MockInstance
  let devicesService: SpyObj<DevicesService>
  let userConsentService: SpyObj<UserConsentService>

  const eventSubject = new ReplaySubject<RouterEvent>(1)

  beforeEach(async () => {
    devicesService = createSpyObj('DevicesService', [
      'sendPowerAction',
      'getPowerState',
      'getDevice',
      'setAmtFeatures',
      'getAMTFeatures',
      'reqUserConsentCode',
      'cancelUserConsentCode',
      'getRedirectionExpirationToken'
    ])
    userConsentService = createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])

    devicesService.TargetOSMap = { 0: 'Unknown' } as any
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
    devicesService.device = new Subject<Device>()
    getPowerStateSpy = devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.mockReturnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.mockReturnValue(of({ token: '123' }))
    userConsentService.handleUserConsentDecision.mockReturnValue(of(true))
    userConsentService.handleUserConsentResponse.mockReturnValue(of(true))

    authServiceStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      startwebSocket: new EventEmitter<boolean>(false)
    }

    @Component({
      template: '',
      // eslint-disable-next-line @angular-eslint/component-selector
      selector: 'amt-sol',
      imports: []
    })
    class TestAMTSOLComponent {
      readonly deviceConnection = input('')

      readonly deviceId = input('')

      readonly mpsServer = input('')

      readonly authToken = input('')

      @Output()
      deviceStatusChange = new EventEmitter<number>()
    }
    @Component({
      template: '',
      selector: 'app-device-toolbar',
      imports: []
    })
    class TestDeviceToolbarComponent {
      readonly isLoading = input(false)

      readonly deviceState = signal(0)
    }

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        SolComponent,
        TestDeviceToolbarComponent,
        TestAMTSOLComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: { ...devicesService, ...authServiceStub } },
        { provide: UserConsentService, useValue: userConsentService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } }
      ]
    })

    router = TestBed.inject(Router)
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(SolComponent)
    component = fixture.componentInstance
    snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)
    vi.spyOn(router, 'navigate').mockImplementation((() => undefined) as any)
    displayErrorSpy = vi.spyOn(component, 'displayError')
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
  })
  it('should have correct state on connect/disconnect methods', () => {
    // Spy on the deviceConnection.set method to verify it's called
    const deviceConnectionSpy = vi.spyOn(component.deviceConnection, 'set').mockImplementation(() => undefined)

    fixture.detectChanges()

    // Check initial state
    expect(component.isDisconnecting).toBe(false)

    // Test connect method
    component.connect()
    fixture.detectChanges()
    expect(component.isLoading()).toBe(false)

    // Test disconnect method
    component.disconnect()
    fixture.detectChanges()

    // Verify that deviceConnection.set was called with false
    expect(deviceConnectionSpy).toHaveBeenCalledWith(false)
    expect(component.isDisconnecting).toBeTruthy()
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting = true
    component.deviceStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(0)
  })
  it('should show error and hide loading when isDisconnecting is false', () => {
    component.isDisconnecting = false
    component.deviceStatus(0)
    expect(snackBarSpy).toHaveBeenCalledExactlyOnceWith(
      'Connecting to SOL failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.',
      undefined,
      SnackbarDefaults.defaultError
    )
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(0)
  })
  it('should  hide loading when connected', () => {
    component.deviceStatus(3)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(3)
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
  it('enable SOL dialog', () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    component.enableSolDialog()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('cancel enable sol request msg true', async () => {
    component.cancelEnableSolResponse(true)
    expect(snackBarSpy).toHaveBeenCalled()
    expect(component.readyToLoadSol).toBe(false)
  })
  it('cancel enable sol request msg false', async () => {
    component.cancelEnableSolResponse(false)
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
            kvmAvailable: true,
            KVM: true,
            SOL: true,
            IDER: true,
            redirection: true,
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
  it('getPowerState', async () => {
    component.getPowerState('111')
    expect(getPowerStateSpy).toHaveBeenCalled()
  })
  it('getPowerState error', async () => {
    await new Promise<void>((done) => {
      component.isLoading.set(true)
      getPowerStateSpy = devicesService.getPowerState.mockReturnValue(throwError(() => new Error('err')))
      component.getPowerState('111').subscribe({
        error: () => {
          expect(getPowerStateSpy).toHaveBeenCalled()
          expect(component.isLoading()).toBe(false)
          expect(displayErrorSpy).toHaveBeenCalled()
          done()
        }
      })
    })
  })
  it('checkUserConsent yes', async () => {
    component.checkUserConsent()
    fixture.detectChanges()
    expect(component.readyToLoadSol).toBe(true)
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
    component.readyToLoadSol = false
    component.checkUserConsent()
    expect(component.readyToLoadSol).toBe(false)
  })
  it('handlePowerState 2', async () => {
    component.handlePowerState({ powerstate: 2 }).subscribe((results) => {
      expect(results).toBe(true)
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

  it('handleAMTFeatureResponse SOL already enabled', async () => {
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
      }
    })
  })
  it('handleAMTFeatureResponse enableSolDialog error', async () => {
    component.amtFeatures.set({
      userConsent: 'none',
      KVM: true,
      SOL: false,
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
    vi.spyOn(component, 'enableSolDialog').mockReturnValue(throwError(() => new Error('err')))
    component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
      error: () => {
        expect(displayErrorSpy).toHaveBeenCalled()
      }
    })
  })
  it('handleAMTFeatureResponse cancel enableSol', async () => {
    await new Promise<void>((done) => {
      const cancelEnableSolResponseSpy = vi
        .spyOn(component, 'cancelEnableSolResponse')
        .mockImplementation(() => undefined)
      component.amtFeatures.set({
        userConsent: 'none',
        KVM: true,
        SOL: false,
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
      vi.spyOn(component, 'enableSolDialog').mockReturnValue(of(false))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        next: (results) => {
          expect(cancelEnableSolResponseSpy).toHaveBeenCalled()
          expect(results).toEqual(false)
          done()
        }
      })
    })
  })
  it('handleAMTFeatureResponse enableSol', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({
        userConsent: 'none',
        KVM: true,
        SOL: false,
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
      vi.spyOn(component, 'enableSolDialog').mockReturnValue(of(true))
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
      vi.spyOn(component, 'enableSolDialog').mockReturnValue(of(true))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        next: () => {
          expect(setAmtFeaturesSpy).toHaveBeenCalled()
          done()
        }
      })
    })
  })
  it('handleAMTFeatureResponse should show enable dialog when both redirection and SOL are false', async () => {
    await new Promise<void>((done) => {
      component.amtFeatures.set({
        userConsent: 'none',
        KVM: true,
        SOL: false,
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
      vi.spyOn(component, 'enableSolDialog').mockReturnValue(of(true))
      component.handleAMTFeaturesResponse(component.amtFeatures()!).subscribe({
        next: () => {
          expect(setAmtFeaturesSpy).toHaveBeenCalled()
          done()
        }
      })
    })
  })
  it('deviceStatus 3', async () => {
    component.deviceStatus(3)
    expect(component.isLoading()).toEqual(false)
  })
  it('deviceStatus 0', async () => {
    component.isDisconnecting = false
    component.deviceStatus(0)
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
})
