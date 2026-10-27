/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { TestBed } from '@angular/core/testing'
import { Router, RouterModule } from '@angular/router'
import { of, throwError } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { provideTranslateService } from '@ngx-translate/core'
import { environment } from '../../environments/environment'
import { DevicesService } from './devices.service'
import { UserConsentService } from './user-consent.service'
import { PowerActionService } from './power-action.service'
import SnackbarDefaults from '../shared/config/snackBarDefault'

describe('PowerActionService', () => {
  let service: PowerActionService
  let devicesService: SpyObj<DevicesService>
  let userConsentService: SpyObj<UserConsentService>
  let snackBar: SpyObj<MatSnackBar>
  let sendPowerActionSpy: MockInstance
  let isLoading: { set: MockInstance }

  const isCloudMode = environment.cloud

  beforeEach(() => {
    snackBar = createSpyObj('MatSnackBar', ['open'])
    devicesService = createSpyObj('DevicesService', [
      'sendPowerAction',
      'getPowerState',
      'getPowerStateCached',
      'getAMTFeatures',
      'getAMTVersion',
      'getBootSources'
    ])
    userConsentService = createSpyObj('UserConsentService', ['handleUserConsentDecision', 'handleUserConsentResponse'])
    userConsentService.handleUserConsentDecision.mockReturnValue(of(null))
    userConsentService.handleUserConsentResponse.mockReturnValue(of({ Body: { ReturnValue: 0 } }))

    sendPowerActionSpy = devicesService.sendPowerAction.mockReturnValue(of({ Body: { ReturnValueStr: 'NOT_READY' } }))
    devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
    devicesService.getPowerStateCached.mockReturnValue(of({ powerstate: 2 }))
    devicesService.getAMTFeatures.mockReturnValue(of({ userConsent: 'None' } as any))
    devicesService.getAMTVersion.mockReturnValue(
      of({ AMT_SetupAndConfigurationService: { response: { ProvisioningMode: 1 } } })
    )

    TestBed.configureTestingModule({
      imports: [RouterModule],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesService },
        { provide: UserConsentService, useValue: userConsentService },
        { provide: MatSnackBar, useValue: snackBar }
      ]
    })

    service = TestBed.inject(PowerActionService)
    isLoading = { set: vi.fn() }
  })

  afterEach(() => {
    environment.cloud = isCloudMode
    TestBed.resetTestingModule()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('buildPowerOptions', () => {
    it('returns only base options when amtFeatures is null', () => {
      const options = service.buildPowerOptions(null)
      expect(options.find((o) => o.action === 105)).toBeFalsy()
      expect(options.find((o) => o.action === 7)).toBeTruthy()
    })

    it('adds conditional options sorted by action when ocr is supported', () => {
      const options = service.buildPowerOptions({
        ocr: true,
        httpsBootSupported: true,
        localPBABootSupported: true,
        winREBootSupported: true
      } as any)

      expect(options.find((o) => o.action === 105)).toBeTruthy()
      expect(options.find((o) => o.action === 107)).toBeTruthy()
      expect(options.find((o) => o.action === 109)).toBeTruthy()
      const actions = options.map((o) => o.action)
      expect(actions).toEqual([...actions].sort((a, b) => a - b))
    })
  })

  describe('sendPowerAction', () => {
    it('executes an unauthorized action directly', () => {
      service.sendPowerAction('guid', 4, isLoading)
      expect(sendPowerActionSpy).toHaveBeenCalledWith('guid', 4, false, {})
    })

    it('routes authorized actions through preprocessing', () => {
      const spy = vi.spyOn(service, 'preprocessingForAuthorizedPowerAction')
      service.sendPowerAction('guid', 100, isLoading)
      expect(spy).toHaveBeenCalledWith('guid', 100, isLoading)
    })
  })

  describe('preprocessingForAuthorizedPowerAction', () => {
    it('dispatches HTTP boot actions', () => {
      const spy = vi.spyOn(service, 'performHTTPBoot').mockImplementation(() => undefined)
      service.preprocessingForAuthorizedPowerAction('guid', 105, isLoading)
      expect(spy).toHaveBeenCalledWith('guid', 105, isLoading)
    })

    it('dispatches PBA boot actions', () => {
      const spy = vi.spyOn(service, 'performPBABoot').mockImplementation(() => undefined)
      service.preprocessingForAuthorizedPowerAction('guid', 107, isLoading)
      expect(spy).toHaveBeenCalledWith('guid', 107, isLoading)
    })

    it('dispatches WinRE boot actions', () => {
      const spy = vi.spyOn(service, 'performWinREBoot').mockImplementation(() => undefined)
      service.preprocessingForAuthorizedPowerAction('guid', 109, isLoading)
      expect(spy).toHaveBeenCalledWith('guid', 109, isLoading)
    })

    it('uses SOL when resetting to BIOS from the SOL route', () => {
      const router = TestBed.inject(Router)
      vi.spyOn(router, 'url', 'get').mockReturnValue('/devices/guid/sol')
      const spy = vi.spyOn(service, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)
      service.preprocessingForAuthorizedPowerAction('guid', 101, isLoading)
      expect(spy).toHaveBeenCalledWith('guid', 101, isLoading, true)
    })
  })

  describe('performHTTPBoot / performPBABoot / performWinREBoot', () => {
    it('opens the HTTP boot dialog and executes the action on close', () => {
      const dialogRefSpyObj = createSpyObj({ afterClosed: of({ url: 'http://x' }), close: null })
      vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
      const executeSpy = vi.spyOn(service, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)

      service.performHTTPBoot('guid', 105, isLoading)

      expect(executeSpy).toHaveBeenCalledWith('guid', 105, isLoading, false, { url: 'http://x' })
    })

    it('does nothing when the HTTP boot dialog is dismissed without boot details', () => {
      const dialogRefSpyObj = createSpyObj({ afterClosed: of(null), close: null })
      vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
      const executeSpy = vi.spyOn(service, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)

      service.performHTTPBoot('guid', 105, isLoading)

      expect(executeSpy).not.toHaveBeenCalled()
    })

    it('opens the PBA boot dialog filtered to PBA sources', () => {
      devicesService.getBootSources.mockReturnValue(
        of([
          { biosBootString: 'PBA1' },
          { biosBootString: 'Other' }
        ] as any)
      )
      const dialogRefSpyObj = createSpyObj({ afterClosed: of({ bootPath: 'x' }), close: null })
      const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
      const executeSpy = vi.spyOn(service, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)

      service.performPBABoot('guid', 107, isLoading)

      expect(dialogSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ data: expect.objectContaining({ pbaBootFilesPath: [{ biosBootString: 'PBA1' }] }) })
      )
      expect(executeSpy).toHaveBeenCalledWith('guid', 107, isLoading, false, { bootPath: 'x' })
    })

    it('executes the WinRE boot action with secure boot enforced', () => {
      const executeSpy = vi.spyOn(service, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)
      service.performWinREBoot('guid', 109, isLoading)
      expect(executeSpy).toHaveBeenCalledWith('guid', 109, isLoading, false, { enforceSecureBoot: true })
    })
  })

  describe('executeAuthorizedPowerAction', () => {
    it('executes the power action immediately when user consent is not required', () => {
      devicesService.getAMTFeatures.mockReturnValue(of({ userConsent: 'None' } as any))
      const executeSpy = vi.spyOn(service, 'executePowerAction').mockImplementation(() => undefined)

      service.executeAuthorizedPowerAction('guid', 2, isLoading)

      expect(executeSpy).toHaveBeenCalledWith('guid', 2, isLoading, false, {})
      expect(isLoading.set).toHaveBeenLastCalledWith(false)
    })

    it('checks user consent using the freshly-fetched AMT features', () => {
      devicesService.getAMTFeatures.mockReturnValue(of({ userConsent: 'some', optInState: 3 } as any))
      const executeSpy = vi.spyOn(service, 'executePowerAction').mockImplementation(() => undefined)

      service.executeAuthorizedPowerAction('guid', 2, isLoading)

      expect(userConsentService.handleUserConsentDecision).toHaveBeenCalledWith(true, 'guid', {
        userConsent: 'some',
        optInState: 3
      })
      expect(executeSpy).toHaveBeenCalledWith('guid', 2, isLoading, false, {})
    })

    it('shows an error snackbar when the consent chain fails', () => {
      userConsentService.handleUserConsentResponse.mockReturnValue(throwError(() => new Error('fail')))

      service.executeAuthorizedPowerAction('guid', 2, isLoading)

      expect(snackBar.open).toHaveBeenCalledWith('devices.errorInitializing.value', undefined, SnackbarDefaults.defaultError)
    })
  })

  describe('executePowerAction', () => {
    it('shows a NOT_READY warning in cloud mode', () => {
      environment.cloud = true
      service.executePowerAction('guid', 2, isLoading)
      expect(snackBar.open).toHaveBeenCalledWith(
        'devices.powerActionNotReady.value',
        undefined,
        SnackbarDefaults.defaultWarn
      )
    })

    it('shows a success message in cloud mode when accepted', () => {
      environment.cloud = true
      sendPowerActionSpy.mockReturnValue(of({ Body: { ReturnValueStr: 'SUCCESS' } }))
      service.executePowerAction('guid', 2, isLoading)
      expect(snackBar.open).toHaveBeenCalledWith(
        'devices.powerActionSent.value',
        undefined,
        SnackbarDefaults.defaultSuccess
      )
    })

    it('sets optimistic power state and silently refreshes after a successful non-cloud action', () => {
      vi.useFakeTimers()
      environment.cloud = false
      sendPowerActionSpy.mockReturnValue(of({ ReturnValue: 0 }))

      service.executePowerAction('guid', 2, isLoading)

      expect(service.powerState()).toBe('deviceToolbar.power.on.value')
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 4 }))

      vi.advanceTimersByTime(5000)

      expect(devicesService.getPowerState).toHaveBeenCalledWith('guid')
      expect(service.powerState()).toBe('deviceToolbar.power.sleep.value')
      vi.useRealTimers()
    })

    it('shows an error when a non-cloud action fails', () => {
      environment.cloud = false
      sendPowerActionSpy.mockReturnValue(of({ ReturnValue: 1 }))
      service.executePowerAction('guid', 2, isLoading)
      expect(snackBar.open).toHaveBeenCalledWith('devices.failPowerAction.value', undefined, SnackbarDefaults.defaultError)
    })

    it('shows an error and resets loading when the request errors', () => {
      sendPowerActionSpy.mockReturnValue(throwError(() => new Error('network')))
      service.executePowerAction('guid', 2, isLoading)
      expect(snackBar.open).toHaveBeenCalledWith('devices.errorPowerAction.value', undefined, SnackbarDefaults.defaultError)
      expect(isLoading.set).toHaveBeenLastCalledWith(false)
    })
  })

  describe('loadPowerState / refreshPowerState / silentRefreshPowerState', () => {
    it('loads power state using the cached API', () => {
      service.loadPowerState('guid', isLoading)
      expect(devicesService.getPowerStateCached).toHaveBeenCalledWith('guid')
      expect(service.powerState()).toBe('deviceToolbar.power.on.value')
      expect(isLoading.set).toHaveBeenCalledWith(true)
      expect(isLoading.set).toHaveBeenLastCalledWith(false)
    })

    it('refreshes power state using the non-cached API', () => {
      service.refreshPowerState('guid', isLoading)
      expect(devicesService.getPowerState).toHaveBeenCalledWith('guid')
    })

    it('shows an error snackbar when refresh fails', () => {
      devicesService.getPowerState.mockReturnValue(throwError(() => new Error('network')))
      service.refreshPowerState('guid', isLoading)
      expect(snackBar.open).toHaveBeenCalledWith('kvm.errorRetrievePower.value', undefined, SnackbarDefaults.defaultError)
      expect(isLoading.set).toHaveBeenLastCalledWith(false)
    })

    it('silently refreshes without toggling isLoading', () => {
      isLoading.set.mockClear()
      service.silentRefreshPowerState('guid', isLoading)
      expect(devicesService.getPowerState).toHaveBeenCalledWith('guid')
      expect(isLoading.set).not.toHaveBeenCalled()
    })
  })
})
