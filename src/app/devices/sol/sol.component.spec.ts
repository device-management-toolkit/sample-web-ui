/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { Component, EventEmitter, Output, signal, input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { NavigationStart, Router, RouterModule } from '@angular/router'
import { EMPTY, of, Subject, throwError } from 'rxjs'
import { SolComponent } from './sol.component'
import { DevicesService } from '../devices.service'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { MatDialog } from '@angular/material/dialog'
import { Device } from '../../../models/models'
import { UserConsentService } from '../user-consent.service'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { SOLComponent, SolTerminalType } from '@device-management-toolkit/ui-toolkit-angular'
import { MatSelect } from '@angular/material/select'

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

  let eventSubject: Subject<NavigationStart>

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
        RouterModule,
        SolComponent,
        TestDeviceToolbarComponent,
        TestAMTSOLComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: { ...devicesService, ...authServiceStub } },
        { provide: UserConsentService, useValue: userConsentService }
      ]
    })

    router = TestBed.inject(Router)
    eventSubject = new Subject<NavigationStart>()
    vi.spyOn(router, 'events', 'get').mockReturnValue(eventSubject)
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(SolComponent)
    component = fixture.componentInstance
    snackBarSpy = vi.spyOn(component.snackBar, 'open').mockImplementation((() => undefined) as any)
    vi.spyOn(router, 'navigate').mockImplementation((() => undefined) as any)
    displayErrorSpy = vi.spyOn(component, 'displayError')
  })

  afterEach(() => {
    vi.useRealTimers()
    TestBed.resetTestingModule()
  })

  it('starts idle with the encoding selector available before connecting', () => {
    expect(component).toBeTruthy()
    fixture.detectChanges()
    const select: MatSelect = fixture.debugElement.query(By.directive(MatSelect)).componentInstance
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(select.disabled).toBe(false)
    expect(button.textContent).toContain('sol.connect.value')
    expect(fixture.nativeElement.querySelector('#sol-encoding-guidance')).toBeNull()
    expect(fixture.nativeElement.querySelector('mat-select').getAttribute('aria-describedby')).toBeNull()
    expect(tokenSpy).not.toHaveBeenCalled()
    expect(getPowerStateSpy).not.toHaveBeenCalled()
    expect(getAMTFeaturesSpy).not.toHaveBeenCalled()
  })
  it('allows selecting UTF-8 before connecting', () => {
    component.readyToLoadSol.set(false)
    fixture.detectChanges()
    const select = fixture.debugElement.query(By.directive(MatSelect))
    expect(select.componentInstance.value).toBe(SolTerminalType.PCANSI)
    select.triggerEventHandler('selectionChange', { value: SolTerminalType.VTUTF8 })
    fixture.detectChanges()
    expect(component.terminalType()).toBe(SolTerminalType.VTUTF8)
    expect(select.componentInstance.value).toBe(SolTerminalType.VTUTF8)
  })

  it('applies the selected mode on first connection and after reconnect', () => {
    component.setTerminalType(SolTerminalType.VTUTF8)
    component.readyToLoadSol.set(true)
    fixture.detectChanges()
    const sol: SOLComponent = fixture.debugElement.query(By.directive(SOLComponent)).componentInstance
    vi.spyOn(sol, 'startSol').mockReturnValue(undefined)
    component.deviceConnection.set(true)
    fixture.detectChanges()
    expect(sol.terminalType).toBe(SolTerminalType.VTUTF8)
    component.deviceConnection.set(false)
    fixture.detectChanges()
    component.deviceConnection.set(true)
    fixture.detectChanges()
    expect(sol.terminalType).toBe(SolTerminalType.VTUTF8)
  })

  it('selects encoding while disconnected and applies it to the next connection', () => {
    tokenSpy.mockReturnValue(EMPTY)
    fixture.detectChanges()
    const connect = vi.spyOn(component, 'connect')
    const disconnect = vi.spyOn(component, 'disconnect')
    component.setTerminalType(SolTerminalType.VTUTF8)
    expect(component.terminalType()).toBe(SolTerminalType.VTUTF8)
    expect(connect).not.toHaveBeenCalled()
    expect(disconnect).not.toHaveBeenCalled()
    expect(snackBarSpy).not.toHaveBeenCalled()
    component.readyToLoadSol.set(true)
    fixture.detectChanges()
    const sol: SOLComponent = fixture.debugElement.query(By.directive(SOLComponent)).componentInstance
    expect(sol.terminalType).toBe(SolTerminalType.VTUTF8)
  })

  it('locks the selector while connecting and preserves the encoding', () => {
    component.readyToLoadSol.set(true)
    fixture.detectChanges()
    const sol: SOLComponent = fixture.debugElement.query(By.directive(SOLComponent)).componentInstance
    component.isConnecting.set(true)
    fixture.detectChanges()
    const select: MatSelect = fixture.debugElement.query(By.directive(MatSelect)).componentInstance
    expect(select.disabled).toBe(true)
    expect(() => component.setTerminalType(SolTerminalType.VTUTF8)).not.toThrow()
    expect(component.terminalType()).toBe(SolTerminalType.PCANSI)
    expect(sol.terminalType).toBe(SolTerminalType.PCANSI)
    component.isConnecting.set(false)
    fixture.detectChanges()
    expect(select.disabled).toBe(false)
    component.setTerminalType(SolTerminalType.VTUTF8)
    expect(component.terminalType()).toBe(SolTerminalType.VTUTF8)
    fixture.detectChanges()
    expect(sol.terminalType).toBe(SolTerminalType.VTUTF8)
  })

  it('explains that changing encoding requires disconnecting while locked', () => {
    component.deviceConnection.set(true)
    const translate = TestBed.inject(TranslateService)
    translate.setTranslation('en', {
      'deviceDetail.solDescription': { value: 'Serial Over LAN' }
    })
    translate.use('en')
    fixture.detectChanges()
    const card: HTMLElement = fixture.nativeElement.querySelector('mat-card')
    expect(card.querySelector('mat-card-title')?.textContent).toContain('Serial Over LAN')
    const content = card.querySelector('mat-card-content')!
    expect(content.querySelector('#sol-encoding-guidance')).not.toBeNull()
    const select: HTMLElement = content.querySelector('mat-select')!
    expect(select).not.toBeNull()
    expect(select.getAttribute('aria-describedby')).toBe('sol-encoding-guidance')
  })

  it('disables the encoding selector during connection transitions', () => {
    tokenSpy.mockReturnValue(EMPTY)
    fixture.detectChanges()
    component.isConnecting.set(false)
    component.isLoading.set(false)
    component.isDisconnecting.set(false)
    fixture.detectChanges()
    const select: MatSelect = fixture.debugElement.query(By.directive(MatSelect)).componentInstance
    expect(select.disabled).toBe(false)
    for (const busy of [
      component.isConnecting,
      component.isLoading,
      component.isDisconnecting
    ]) {
      busy.set(true)
      fixture.detectChanges()
      expect(select.disabled).toBe(true)
      busy.set(false)
    }
    fixture.detectChanges()
    expect(select.disabled).toBe(false)
  })

  it.each([
    'disconnect',
    'navigation',
    'destroy'
  ])('cancels a queued manual reconnect retry on %s', (action) => {
    vi.useFakeTimers()
    component.deviceConnection.set(true)
    component.disconnect()
    component.deviceStatus(0)
    component.connect()
    component.deviceStatus(0)
    const connect = vi.spyOn(component, 'connect')
    if (action === 'disconnect') component.disconnect()
    if (action === 'navigation') eventSubject.next(new NavigationStart(1, '/devices'))
    if (action === 'destroy') component.ngOnDestroy()
    vi.advanceTimersByTime(10_000)
    expect(connect).not.toHaveBeenCalled()
  })

  it('ignores unsupported selector values without changing the selection', () => {
    // @ts-expect-error Exercise invalid values from untyped consumers.
    expect(() => component.setTerminalType(0)).not.toThrow()
    expect(component.terminalType()).toBe(SolTerminalType.PCANSI)
  })

  it('records the connect state', () => {
    expect(() => component.deviceStatus(1)).not.toThrow()
    expect(component.deviceState()).toBe(1)
  })

  it('should have correct state on connect/disconnect methods', () => {
    fixture.detectChanges()

    expect(component.isDisconnecting()).toBe(false)

    component.connect()
    expect(component.deviceConnection()).toBe(true)
    expect(component.deviceState()).not.toBe(0)

    component.disconnect()
    expect(component.deviceConnection()).toBe(false)
    expect(component.isDisconnecting()).toBeTruthy()
  })
  it('should disable Connect SOL until the initial token is available', () => {
    const tokenSubject = new Subject<{ token: string }>()
    tokenSpy.mockReturnValue(tokenSubject)
    const initSpy = vi.spyOn(component, 'init')

    fixture.detectChanges()

    const connectButton: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(connectButton.textContent).toContain('sol.connect.value')
    connectButton.click()
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(button.disabled).toBe(true)
    expect(button.textContent).toContain('sol.loading.value')
    expect(initSpy).not.toHaveBeenCalled()

    tokenSubject.next({ token: 'fresh-token' })

    expect(component.authToken()).toBe('fresh-token')
    expect(initSpy).toHaveBeenCalledOnce()
  })
  it('should re-enable Connect SOL when the token request completes without a token', () => {
    tokenSpy.mockReturnValue(EMPTY)

    fixture.detectChanges()
    fixture.nativeElement.querySelector('button').click()
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(component.isLoading()).toBe(false)
    expect(component.isConnecting()).toBe(false)
    expect(button.disabled).toBe(false)
    expect(button.textContent).toContain('sol.connect.value')
  })
  it('should re-enable Connect SOL when setup finishes without a session', () => {
    getPowerStateSpy.mockReturnValue(of({ powerstate: 0 }))
    vi.spyOn(component, 'showPowerUpAlert').mockReturnValue(of(false))

    fixture.detectChanges()
    fixture.nativeElement.querySelector('button').click()
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(component.deviceConnection()).toBe(false)
    expect(component.isConnecting()).toBe(false)
    expect(button.disabled).toBe(false)
    expect(button.textContent).toContain('sol.connect.value')
  })
  it('should show "Connect SOL" after a manual disconnect completes', () => {
    tokenSpy.mockReturnValue(new Subject<{ token: string }>())
    fixture.detectChanges()

    // Simulate a connected session
    component.deviceConnection.set(true)
    component.deviceState.set(3)
    component.isConnecting.set(false)
    component.isLoading.set(false)
    fixture.detectChanges()

    let button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(button.textContent).toContain('sol.disconnect.value')

    // Simulate a manual disconnect: child reports deviceStatus(0) after disconnect() is called
    component.disconnect()
    component.deviceStatus(0)
    fixture.detectChanges()

    button = fixture.nativeElement.querySelector('button')
    expect(button.disabled).toBe(false)
    expect(button.textContent).toContain('sol.connect.value')
    expect(component.isDisconnecting()).toBe(false)
    tokenSpy.mockReturnValue(of({ token: 'fresh-token' }))
    component.connect()
    expect(component.deviceConnection()).toBe(true)
    expect(component.isDisconnecting()).toBe(false)
  })
  it('should disable Connect SOL until a manual disconnect completes', () => {
    tokenSpy.mockReturnValue(new Subject<{ token: string }>())
    fixture.detectChanges()
    component.deviceConnection.set(false)
    component.isLoading.set(false)
    component.isDisconnecting.set(true)
    const connectSpy = vi.spyOn(component, 'connect')
    fixture.detectChanges(false)

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(button.disabled).toBe(true)
    expect(button.textContent).toContain('sol.disconnect.value')
    button.click()
    expect(connectSpy).not.toHaveBeenCalled()

    component.deviceStatus(0)
    expect(component.deviceConnection()).toBe(false)
    expect(component.isDisconnecting()).toBe(false)
  })
  it('should not show "Connect SOL" while waiting for the connected status', () => {
    fixture.detectChanges()

    component.deviceState.set(0)
    component.connect()
    component.isLoading.set(false)
    fixture.detectChanges()

    const button: HTMLElement = fixture.nativeElement.querySelector('button')
    expect(component.deviceState()).toBe(1)
    expect(button.textContent).not.toContain('sol.connect.value')
  })
  it('should allow reconnecting after an unexpected disconnect', () => {
    fixture.detectChanges()
    component.deviceConnection.set(true)
    component.deviceState.set(3)
    component.isDisconnecting.set(false)

    component.deviceStatus(0)
    fixture.detectChanges()

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
    expect(component.deviceConnection()).toBe(false)
    expect(button.textContent).toContain('sol.connect.value')

    button.click()
    fixture.detectChanges()

    expect(tokenSpy).toHaveBeenCalledTimes(1)
    expect(component.authToken()).toBe('123')
    expect(component.deviceConnection()).toBe(true)
    expect(component.isConnecting()).toBe(true)
    expect(component.deviceState()).not.toBe(0)
  })
  it('should retry a failed reconnect after a manual disconnect without showing an error', () => {
    vi.useFakeTimers()
    component.deviceConnection.set(true)
    component.deviceState.set(3)

    component.disconnect()
    component.deviceStatus(0)
    component.connect()
    const tokenCallsBeforeRetry = tokenSpy.mock.calls.length

    component.deviceStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(true)

    vi.advanceTimersByTime(2_000)
    expect(tokenSpy).toHaveBeenCalledTimes(tokenCallsBeforeRetry + 1)
    expect(component.isConnecting()).toBe(true)

    component.deviceStatus(3)
    expect(component.isConnecting()).toBe(false)
  })
  it('should cancel a queued reconnect retry when SOL connects', () => {
    vi.useFakeTimers()
    component.deviceConnection.set(true)
    component.deviceState.set(3)

    component.disconnect()
    component.deviceStatus(0)
    component.connect()
    component.deviceStatus(0)
    const tokenCallsBeforeConnection = tokenSpy.mock.calls.length

    component.deviceStatus(3)
    vi.advanceTimersByTime(2_000)

    expect(tokenSpy).toHaveBeenCalledTimes(tokenCallsBeforeConnection)
    expect(component.isConnecting()).toBe(false)
  })
  it('should show an error after manual reconnect retries are exhausted', () => {
    vi.useFakeTimers()
    component.deviceConnection.set(true)
    component.deviceState.set(3)

    component.disconnect()
    component.deviceStatus(0)
    component.connect()

    for (const retryDelay of [
      2_000,
      4_000,
      8_000
    ]) {
      component.deviceStatus(0)
      expect(snackBarSpy).not.toHaveBeenCalled()
      vi.advanceTimersByTime(retryDelay)
    }

    component.deviceStatus(0)
    expect(snackBarSpy).toHaveBeenCalledExactlyOnceWith(
      'Connecting to SOL failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.',
      undefined,
      SnackbarDefaults.defaultError
    )
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting.set(true)
    component.deviceStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(0)
  })
  it('should show error and hide loading when isDisconnecting is false', () => {
    component.isDisconnecting.set(false)
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
    expect(snackBarSpy).toHaveBeenCalledExactlyOnceWith('sol.connectedHint.value', undefined, {
      duration: 5_000,
      politeness: 'polite'
    })
    expect(component.isLoading()).toBe(false)
    expect(component.deviceState()).toBe(3)
  })
  it('shows the translated connected hint once per connection, including reconnects', () => {
    const message = 'Connected. If the screen is blank, use a navigation key to request fresh output.'
    const translate = TestBed.inject(TranslateService)
    translate.setTranslation('en', { 'sol.connectedHint': { value: message } })
    translate.use('en')
    component.deviceStatus(3)
    component.deviceStatus(3)
    expect(snackBarSpy).toHaveBeenCalledExactlyOnceWith(message, undefined, { duration: 5_000, politeness: 'polite' })
    component.isDisconnecting.set(true)
    component.deviceStatus(0)
    component.deviceStatus(1)
    component.deviceStatus(3)
    expect(snackBarSpy).toHaveBeenCalledTimes(2)
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
    expect(component.readyToLoadSol()).toBe(false)
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
    component.amtFeatures.set({ userConsent: 'none', optInState: 0 } as any)
    component.checkUserConsent()
    expect(component.readyToLoadSol()).toBe(true)
  })
  it('uses a fresh token and passes it to SOL after reconnect', () => {
    fixture.detectChanges()
    tokenSpy.mockClear()
    tokenSpy.mockReturnValue(of({ token: 'fresh-token' }))
    component.deviceConnection.set(false)
    component.readyToLoadSol.set(true)
    component.isLoading.set(false)
    fixture.detectChanges()

    component.connect()
    fixture.detectChanges()

    const sol = fixture.debugElement.query(By.css('amt-sol')).componentInstance
    expect(tokenSpy).toHaveBeenCalledOnce()
    expect(component.authToken()).toBe('fresh-token')
    expect(sol.authToken()).toBe('fresh-token')
    expect(component.deviceConnection()).toBe(true)
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
    component.readyToLoadSol.set(false)
    component.checkUserConsent()
    expect(component.readyToLoadSol()).toBe(false)
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
    component.isDisconnecting.set(false)
    component.deviceStatus(0)
    expect(component.isLoading()).toEqual(false)
    expect(displayErrorSpy).toHaveBeenCalled()
    expect(component.isDisconnecting()).toEqual(false)
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
