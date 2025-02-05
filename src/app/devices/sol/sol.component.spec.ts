/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Component, EventEmitter, Input, Output } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, Router, RouterEvent, RouterModule } from '@angular/router'
import { of, ReplaySubject, Subject, throwError } from 'rxjs'
import { SolComponent } from './sol.component'
import { DevicesService } from '../devices.service'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device } from 'src/models/models'
import { UserConsentService } from '../user-consent.service'

describe('SolComponent', () => {
  let component: SolComponent
  let fixture: ComponentFixture<SolComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let sendPowerActionSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy
  let snackBarSpy: jasmine.Spy
  let router: Router
  let displayErrorSpy: jasmine.Spy
  let devicesService: jasmine.SpyObj<DevicesService>
  let userConsentService: jasmine.SpyObj<UserConsentService>

  const eventSubject = new ReplaySubject<RouterEvent>(1)

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj('DevicesService', [
      'sendPowerAction',
      'getPowerState',
      'getDevice',
      'setAmtFeatures',
      'getAMTFeatures',
      'reqUserConsentCode',
      'cancelUserConsentCode',
      'getRedirectionExpirationToken'
    ])
    userConsentService = jasmine.createSpyObj('UserConsentService', [
      'handleUserConsentDecision',
      'handleUserConsentResponse'
    ])

    devicesService.TargetOSMap = { 0: 'Unknown' } as any
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(
      of({
        userConsent: 'none',
        KVM: true,
        SOL: true,
        IDER: true,
        redirection: true,
        kvmAvailable: true,
        optInState: 0
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
        optInState: 0
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
    devicesService.device = new Subject<Device>()
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(of({} as any))
    tokenSpy = devicesService.getRedirectionExpirationToken.and.returnValue(of({ token: '123' }))
    userConsentService.handleUserConsentDecision.and.returnValue(of(true))
    userConsentService.handleUserConsentResponse.and.returnValue(of(true))

    authServiceStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      startwebSocket: new EventEmitter<boolean>(false)
    }

    @Component({
      // eslint-disable-next-line @angular-eslint/component-selector
      selector: 'amt-sol',
      imports: []
    })
    class TestAMTSOLComponent {
      @Input()
      deviceConnection = ''

      @Input()
      deviceId = ''

      @Input()
      mpsServer = ''

      @Input()
      authToken = ''

      @Output()
      deviceStatusChange = new EventEmitter<number>()
    }
    @Component({
      selector: 'app-device-toolbar',
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
        SolComponent,
        TestDeviceToolbarComponent,
        TestAMTSOLComponent
      ],
      providers: [
        { provide: DevicesService, useValue: { ...devicesService, ...authServiceStub } },
        { provide: UserConsentService, useValue: userConsentService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } }
      ]
    }).compileComponents()

    router = TestBed.inject(Router)
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(SolComponent)
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
  })
  it('should have correct state on websocket events', () => {
    authServiceStub.startwebSocket.emit(true)
    fixture.detectChanges()
    expect(component.isLoading).toBeFalse()
    authServiceStub.stopwebSocket.emit(true)
    fixture.detectChanges()
    expect(component.isDisconnecting).toBeTruthy()
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting = true
    component.deviceStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(0)
  })
  it('should show error and hide loading when isDisconnecting is false', () => {
    component.isDisconnecting = false
    component.deviceStatus(0)
    expect(snackBarSpy).toHaveBeenCalledOnceWith(
      'Connecting to SOL failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.',
      undefined,
      SnackbarDefaults.defaultError
    )
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(0)
  })
  it('should  hide loading when connected', () => {
    component.deviceStatus(3)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(3)
  })
  it('should not show error when NavigationStart triggers', () => {
    eventSubject.next(new NavigationStart(1, 'regular'))
    expect(snackBarSpy).not.toHaveBeenCalled()
  })
  it('power up alert dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.showPowerUpAlert()
    expect(dialogSpy).toHaveBeenCalled()
  })
  it('enable SOL dialog', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
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
    expect(component.isLoading).toBe(false)
  })
  it('getAMTFeatures', (done) => {
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
          optInState: 0
        })
        expect(component.isLoading).toBe(true)
        done()
      }
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
        expect(component.isLoading).toBe(false)
        expect(displayErrorSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('checkUserConsent yes', async () => {
    component.checkUserConsent()
    fixture.detectChanges()
    expect(component.readyToLoadSol).toBe(true)
  })
  it('checkUserConsent no', async () => {
    component.amtFeatures = {
      userConsent: 'all',
      KVM: true,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0
    }
    component.readyToLoadSol = false
    component.checkUserConsent()
    expect(component.readyToLoadSol).toBe(false)
  })
  it('handlePowerState 2', async () => {
    component.handlePowerState({ powerstate: 2 }).subscribe((results) => {
      expect(results).toBe(true)
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

  it('handleAMTFeatureResponse SOL already enabled', async () => {
    component.amtFeatures = {
      userConsent: 'none',
      KVM: true,
      SOL: true,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0
    }
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      next: (results) => {
        expect(results).toEqual(true)
      }
    })
  })
  it('handleAMTFeatureResponse enableSolDialog error', async () => {
    component.amtFeatures = {
      userConsent: 'none',
      KVM: true,
      SOL: false,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0
    }
    spyOn(component, 'enableSolDialog').and.returnValue(throwError(new Error('err')))
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      error: () => {
        expect(displayErrorSpy).toHaveBeenCalled()
      }
    })
  })
  it('handleAMTFeatureResponse cancel enableSol', (done) => {
    const cancelEnableSolResponseSpy = spyOn(component, 'cancelEnableSolResponse')
    component.amtFeatures = {
      userConsent: 'none',
      KVM: true,
      SOL: false,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0
    }
    spyOn(component, 'enableSolDialog').and.returnValue(of(false))
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      next: (results) => {
        expect(cancelEnableSolResponseSpy).toHaveBeenCalled()
        expect(results).toEqual(false)
        done()
      }
    })
  })
  it('handleAMTFeatureResponse enableSol', (done) => {
    component.amtFeatures = {
      userConsent: 'none',
      KVM: true,
      SOL: false,
      IDER: true,
      redirection: true,
      kvmAvailable: true,
      optInState: 0
    }
    spyOn(component, 'enableSolDialog').and.returnValue(of(true))
    component.handleAMTFeaturesResponse(component.amtFeatures).subscribe({
      next: () => {
        expect(setAmtFeaturesSpy).toHaveBeenCalled()
        done()
      }
    })
  })
  it('deviceStatus 3', async () => {
    component.deviceStatus(3)
    expect(component.isLoading).toEqual(false)
  })
  it('deviceStatus 0', async () => {
    component.isDisconnecting = false
    component.deviceStatus(0)
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
})
