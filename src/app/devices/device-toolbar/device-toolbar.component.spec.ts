/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { DevicesService } from '../devices.service'
import {
  DeviceToolbarComponent,
  POWER_IDLE_FAILURE_LIMIT,
  POWER_IDLE_POLL_INTERVAL_MS,
  POWER_POLL_INTERVAL_MS,
  POWER_POLL_TIMEOUT_MS,
  POWER_READ_TIMEOUT_MS,
  POWER_REBOOT_MIN_WAIT_MS,
  POWER_STEADY_ON_READS
} from './device-toolbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { EMPTY, Observable, Subject, of, throwError } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { BootDetails, Device } from '../../../models/models'
import { EventEmitter } from '@angular/core'
import { environment } from '../../../environments/environment'
import { MatSnackBar } from '@angular/material/snack-bar'
import { provideTranslateService } from '@ngx-translate/core'
import SnackbarDefaults from '../../shared/config/snackBarDefault'

describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let sendPowerActionSpy: MockInstance
  let getDeviceSpy: MockInstance
  let sendDeactivateSpy: MockInstance
  let devicesService: SpyObj<DevicesService>
  let snackBar: SpyObj<MatSnackBar>

  const isCloudMode = environment.cloud

  beforeEach(async () => {
    // Create a spy for the snackBar service
    snackBar = createSpyObj('MatSnackBar', ['open'])

    devicesService = createSpyObj('DevicesService', [
      'sendPowerAction',
      'getDevice',
      'sendDeactivate',
      'getPowerState',
      'getPowerStateCached',
      'getAMTFeatures',
      'getAMTFeaturesCached',
      'getAMTVersion',
      'featuresChanges'
    ])
    devicesService.featuresChanges.mockReturnValue(of(null))
    devicesService.deviceState = new EventEmitter<number>()

    devicesService.TargetOSMap = { 0: 'Unknown' } as any
    sendPowerActionSpy = devicesService.sendPowerAction.mockReturnValue(
      of({
        Body: {
          ReturnValueStr: 'NOT_READY'
        }
      })
    )

    devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
    devicesService.getPowerStateCached.mockReturnValue(of({ powerstate: 2 }))
    const mockAMTFeatures = {
      userConsent: 'None',
      ocr: true,
      httpsBootSupported: true,
      kvm: true,
      sol: true,
      ider: true,
      redirection: true,
      optInState: 1,
      kvmAvailable: true,
      winREBootSupported: true,
      localPBABootSupported: true,
      rpe: true,
      rpeSupported: true,
      pbaBootFilesPath: [],
      winREBootFilesPath: {
        instanceID: '',
        biosBootString: '',
        bootString: ''
      }
    } as any
    devicesService.getAMTFeatures.mockReturnValue(of(mockAMTFeatures))
    devicesService.getAMTFeaturesCached.mockReturnValue(of(mockAMTFeatures))
    getDeviceSpy = devicesService.getDevice.mockReturnValue(of({ guid: 'guid' } as any))
    sendDeactivateSpy = devicesService.sendDeactivate.mockReturnValue(of({ status: 'SUCCESS' }))
    devicesService.getAMTVersion.mockReturnValue(
      of({
        AMT_SetupAndConfigurationService: {
          response: { ProvisioningMode: 1 } // Default to ACM mode
        }
      })
    )
    devicesService.device = new Subject<Device>()

    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        DeviceToolbarComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesService },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'guid' })
          }
        }
      ]
    })

    fixture = TestBed.createComponent(DeviceToolbarComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('deviceId', 'guid')

    fixture.detectChanges()
  })

  afterEach(() => {
    environment.cloud = isCloudMode
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDeviceSpy).toHaveBeenCalledWith('guid')
  })

  it('should send power action', () => {
    fixture.componentRef.setInput('deviceId', 'guid')
    component.sendPowerAction(4)

    fixture.detectChanges()

    expect(sendPowerActionSpy).toHaveBeenCalledWith('guid', 4, false, {})
    fixture.detectChanges()
    expect(component.isLoading()()).toBe(false)
  })

  it('should fetch power state using cached API on initial load', () => {
    expect(devicesService.getPowerStateCached).toHaveBeenCalledWith('guid')
    expect(devicesService.getPowerState).not.toHaveBeenCalled()
  })

  it('should fetch power state using non-cached API on refresh', () => {
    devicesService.getPowerState.mockClear()
    devicesService.getPowerStateCached.mockClear()

    component.refreshPowerState()

    expect(devicesService.getPowerState).toHaveBeenCalledWith('guid')
    expect(devicesService.getPowerStateCached).not.toHaveBeenCalled()
  })

  it('should show snackbar and reset loading state when refresh power state fails', () => {
    devicesService.getPowerState.mockReturnValue(throwError(() => new Error('Network error')))

    component.refreshPowerState()

    expect(snackBar.open).toHaveBeenCalled()
    expect(component.isLoading()()).toBe(false)
    expect(component.powerState()).toBe('Unknown')
  })

  describe('power status after a power action', () => {
    const ON = 'deviceToolbar.power.on.value'
    const SLEEP = 'deviceToolbar.power.sleep.value'
    const OFF = 'deviceToolbar.power.off.value'

    // The device reports these states in turn, then keeps reporting the last one (as a real device stays asleep or off).
    const reportStates = (...states: (number | Error)[]): void => {
      devicesService.getPowerState.mockReset()
      const toResponse = (state: number | Error): Observable<{ powerstate: number }> =>
        state instanceof Error ? throwError(() => state) : of({ powerstate: state })
      for (const state of states) {
        devicesService.getPowerState.mockReturnValueOnce(toResponse(state))
      }
      if (states.length > 0) {
        devicesService.getPowerState.mockReturnValue(toResponse(states[states.length - 1]))
      }
    }
    const nextPoll = (): void => {
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
    }

    beforeEach(() => {
      vi.useFakeTimers()
      component.isCloudMode = false
      sendPowerActionSpy.mockReturnValue(of({ ReturnValue: 0 }))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('marks transition and wake polls as background requests but keeps manual refresh foreground', () => {
      reportStates(8)
      component.executePowerAction(12)
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenLastCalledWith('guid', { background: true })

      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenLastCalledWith('guid', { background: true })

      component.refreshPowerState()
      expect(devicesService.getPowerState).toHaveBeenLastCalledWith('guid')
    })

    it.each([
      ['initial', 'success'],
      ['initial', 'error'],
      ['initial', 'empty'],
      ['manual', 'success'],
      ['manual', 'error'],
      ['manual', 'empty']
    ])('cancels a stale %s read before sleep even when it later reports %s', (source, result) => {
      const pending = new Subject<{ powerstate: number }>()
      if (source === 'initial') {
        fixture.destroy()
        devicesService.getPowerStateCached.mockReturnValueOnce(pending)
        fixture = TestBed.createComponent(DeviceToolbarComponent)
        component = fixture.componentInstance
        fixture.componentRef.setInput('deviceId', 'guid')
        fixture.detectChanges()
        component.isCloudMode = false
      } else {
        devicesService.getPowerState.mockReturnValueOnce(pending)
        component.refreshPowerState()
      }
      expect(pending.observed).toBe(true)

      component.executePowerAction(4)
      expect(pending.observed).toBe(false)
      expect(component.isLoading()()).toBe(false)
      snackBar.open.mockClear()

      if (result === 'success') {
        pending.next({ powerstate: 2 })
        pending.complete()
      } else if (result === 'error') {
        pending.error(new Error('stale failure'))
      } else {
        pending.complete()
      }

      expect(component.powerState()).toBe(SLEEP)
      expect(snackBar.open).not.toHaveBeenCalled()

      reportStates(2, 4, 2)
      nextPoll()
      expect(component.powerState()).toBe(SLEEP)
      nextPoll()
      expect(component.powerState()).toBe(SLEEP)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('cancels an older refresh without clearing the loading state of its replacement', () => {
      const older = new Subject<{ powerstate: number }>()
      const newer = new Subject<{ powerstate: number }>()
      devicesService.getPowerState.mockReturnValueOnce(older).mockReturnValueOnce(newer)

      component.refreshPowerState()
      component.refreshPowerState()
      expect(older.observed).toBe(false)
      expect(newer.observed).toBe(true)
      expect(component.isLoading()()).toBe(true)

      older.next({ powerstate: 2 })
      older.complete()
      expect(component.isLoading()()).toBe(true)

      newer.next({ powerstate: 4 })
      newer.complete()
      expect(component.powerState()).toBe(SLEEP)
      expect(component.isLoading()()).toBe(false)
    })

    it('turns yellow immediately on sleep, then green when the device wakes', () => {
      reportStates(2, 2, 4)

      component.executePowerAction(4)
      expect(component.powerState()).toBe(SLEEP)

      nextPoll()
      nextPoll()
      expect(component.powerState()).toBe(SLEEP)

      nextPoll()
      expect(component.powerState()).toBe(SLEEP)
      reportStates(4, 2)
      nextPoll()
      expect(component.powerState()).toBe(SLEEP)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('uses the latest AMT state if sleep is not reported before the transition timeout', () => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))

      component.executePowerAction(4)
      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS - POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(SLEEP)

      nextPoll()
      expect(component.powerState()).toBe(ON)
      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS * 2)
      expect(component.powerState()).toBe(ON)
    })

    it('waits for AMT confirmation before turning red for soft off', () => {
      reportStates(2, 2, 8)

      component.executePowerAction(12)
      expect(component.powerState()).toBe(ON)

      nextPoll()
      nextPoll()
      expect(component.powerState()).toBe(ON)

      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(OFF)
      // still off: keeps checking every 5 s so it turns green as soon as the device is powered on
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(4)
    })

    it.each([
      [
        7,
        'hibernate',
        7
      ],
      [
        8,
        'power off',
        8
      ]
    ])('turns red immediately for %s (%s)', (action, _label, reportedState) => {
      reportStates(reportedState, 2)

      component.executePowerAction(action)
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('keeps soft reset green until AMT reports the device down, then green again when it is back', () => {
      reportStates(2, 8, 2)

      component.executePowerAction(14)
      expect(component.powerState()).toBe(ON)

      nextPoll()
      expect(component.powerState()).toBe(ON)
      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('keeps soft reset green when AMT keeps reporting on', () => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))

      component.executePowerAction(14)
      vi.advanceTimersByTime(POWER_REBOOT_MIN_WAIT_MS)
      expect(component.powerState()).toBe(ON)
    })

    it.each([
      [12, 0],
      [12, 1],
      [10, 0],
      [10, 1]
    ])('keeps Soft Off pending and turns Reset red immediately for action %s, state %s', (action, unknownState) => {
      reportStates(unknownState, 2, 8, 2)

      component.executePowerAction(action)
      const expectedPendingState = action === 12 ? ON : OFF

      nextPoll()
      expect(component.powerState()).toBe(expectedPendingState)
      nextPoll()
      expect(component.powerState()).toBe(expectedPendingState)
      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(ON)
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(4)
    })

    it.each([0, 1])('requires steady on readings after a drop-out interrupted by unknown state %s', (unknownState) => {
      const down = new Error('unreachable')
      const steadyOn = Array<number>(POWER_STEADY_ON_READS).fill(2)
      reportStates(down, down, 2, unknownState, ...steadyOn)

      component.executePowerAction(12)
      for (let poll = 0; poll < 4 + POWER_STEADY_ON_READS - 1; poll++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(4 + POWER_STEADY_ON_READS)
    })

    it('turns red after AMT reports down during power cycle, then green when it is back', () => {
      reportStates(8, new Error('unreachable'), 2)

      component.executePowerAction(5)
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('keeps a power cycle red on AMT state 9 until steady on readings', () => {
      const steadyOn = Array<number>(POWER_STEADY_ON_READS).fill(2)
      reportStates(9, ...steadyOn)

      component.executePowerAction(5)
      nextPoll()
      expect(component.powerState()).toBe(OFF)

      for (let read = 1; read < POWER_STEADY_ON_READS; read++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('turns green on one on reading once AMT reports off after state 9', () => {
      reportStates(9, 8, 2)

      component.executePowerAction(5)
      nextPoll()
      nextPoll()
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('requires steady on readings after a dropout during a power-on action', () => {
      const down = new Error('unreachable')
      const steadyOn = Array<number>(POWER_STEADY_ON_READS).fill(2)
      reportStates(down, down, ...steadyOn)

      component.powerState.set(OFF)
      component.executePowerAction(2)

      for (let poll = 0; poll < 2 + POWER_STEADY_ON_READS - 1; poll++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(2 + POWER_STEADY_ON_READS)
    })

    it.each([
      [5, 'power cycle'],
      [10, 'reset'],
      [101, 'reset to BIOS']
    ])('shows red during reset actions while AMT reports on, then green after the reboot window (%s)', (action) => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))

      component.executePowerAction(action)
      expect(component.powerState()).toBe(OFF)
      for (
        let elapsed = POWER_POLL_INTERVAL_MS;
        elapsed < POWER_REBOOT_MIN_WAIT_MS;
        elapsed += POWER_POLL_INTERVAL_MS
      ) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it.each([
      5,
      10,
      14,
      101
    ])('requires steady recovery after a late drop-out during reboot action %s', (action) => {
      const down = new Error('unreachable')
      const initialOn = Array<number>(Math.floor(POWER_REBOOT_MIN_WAIT_MS / POWER_POLL_INTERVAL_MS) - 3).fill(2)
      const steadyOn = Array<number>(POWER_STEADY_ON_READS).fill(2)
      reportStates(...initialOn, down, down, ...steadyOn)

      component.executePowerAction(action)
      vi.advanceTimersByTime(POWER_REBOOT_MIN_WAIT_MS - POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(OFF)

      for (let recoveryRead = 1; recoveryRead < POWER_STEADY_ON_READS - 1; recoveryRead++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
      const calls = devicesService.getPowerState.mock.calls.length
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(calls)
    })

    it('keeps a reset red through AMT drop-outs and turns green once AMT answers on steadily', () => {
      const down = new Error('unreachable')
      const steadyOn = Array<number>(POWER_STEADY_ON_READS).fill(2)
      reportStates(2, down, down, 2, down, ...steadyOn)

      component.executePowerAction(10)
      for (let i = 0; i < 5 + POWER_STEADY_ON_READS - 1; i++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('shows the last reported state when the device never reaches the expected one', () => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))

      component.executePowerAction(12)
      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS - POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)

      nextPoll()
      expect(component.powerState()).toBe(ON)
      const calls = devicesService.getPowerState.mock.calls.length
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(calls)
    })

    it('turns green by itself when a hibernated device comes back up without the UI', () => {
      reportStates(2, 7)

      component.executePowerAction(7)
      nextPoll()
      nextPoll()
      expect(component.powerState()).toBe(OFF)

      reportStates(7, new Error('unreachable'), 2)
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
    })

    it('keeps following AMT after the device is on, so outside changes show up', () => {
      reportStates(2, 2, 4, 2, 8)

      component.refreshPowerState()
      expect(component.powerState()).toBe(ON)

      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(SLEEP)
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)
    })

    it('expires a stale on state after repeated idle read failures and recovers when AMT responds', () => {
      reportStates(2, ...Array.from({ length: POWER_IDLE_FAILURE_LIMIT }, () => new Error('unreachable')), 2)

      component.refreshPowerState()
      expect(component.powerState()).toBe(ON)

      for (let read = 0; read < POWER_IDLE_FAILURE_LIMIT - 1; read++) {
        vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
        expect(component.powerState()).toBe(ON)
      }

      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe('Unknown')

      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
    })

    it('needs steady on readings after an external power cycle, not the first on read', () => {
      reportStates(2, 9, 2, new Error('unreachable'), ...Array<number>(POWER_STEADY_ON_READS).fill(2))

      component.refreshPowerState()
      expect(component.powerState()).toBe(ON)

      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(OFF)

      for (let read = 1; read < POWER_STEADY_ON_READS; read++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('turns green on the first on read after AMT reports the device off during an external power cycle', () => {
      reportStates(2, 9, 8, 2)

      component.refreshPowerState()
      vi.advanceTimersByTime(POWER_IDLE_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('keeps checking a device that is already off when the page opens', () => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 8 }))
      component.refreshPowerState()
      expect(component.powerState()).toBe(OFF)

      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)

      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
    })

    it('turns green by itself when a sleeping device is woken outside the UI', () => {
      reportStates(4)
      component.executePowerAction(4)
      nextPoll()
      expect(component.powerState()).toBe(SLEEP)

      reportStates(2)
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
    })

    it.each([
      [7, 'hibernate'],
      [4, 'sleep'],
      [12, 'soft off']
    ])('turns green once AMT answers on steadily after a dropout during %s (%s)', (action) => {
      const down = new Error('unreachable')
      reportStates(down, down, 2, 2, 2)

      component.executePowerAction(action)
      for (let i = 0; i < 2; i++) {
        nextPoll()
        expect(component.powerState()).toBe(action === 4 ? SLEEP : OFF)
      }

      for (let i = 0; i < POWER_STEADY_ON_READS; i++) {
        nextPoll()
        expect(component.powerState()).toBe(i === POWER_STEADY_ON_READS - 1 ? ON : action === 4 ? SLEEP : OFF)
      }
    })

    it('ignores a single failed read while sleep is pending', () => {
      reportStates(new Error('blip'), 2, 2)

      component.executePowerAction(4)
      nextPoll()
      nextPoll()
      nextPoll()
      expect(component.powerState()).toBe(SLEEP)
    })

    it('turns soft off red on a single failed read, then green after steady on readings', () => {
      reportStates(new Error('unreachable'), 2, 2)

      component.executePowerAction(12)
      expect(component.powerState()).toBe(ON)

      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(OFF)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it.each([
      0,
      1,
      undefined
    ])('shows Unknown when the device reports an unknown power state (%s)', (state) => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: state }))

      component.refreshPowerState()

      expect(component.powerState()).toBe('Unknown')
    })

    it('shows Unknown at the timeout after empty readings and keeps checking for recovery', () => {
      devicesService.getPowerState.mockReturnValue(EMPTY)

      component.executePowerAction(12)
      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS - POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(OFF)

      nextPoll()
      expect(component.powerState()).toBe('Unknown')
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(POWER_POLL_TIMEOUT_MS / POWER_POLL_INTERVAL_MS - 1)

      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('cancels a pending read at the transition deadline and resumes wake detection', () => {
      reportStates(2)
      component.executePowerAction(12)
      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS - POWER_POLL_INTERVAL_MS * 2)

      const pending = new Subject<{ powerstate: number }>()
      devicesService.getPowerState.mockReturnValue(pending)
      nextPoll()
      expect(pending.observed).toBe(true)
      expect(component.powerState()).toBe(ON)

      nextPoll()
      expect(component.powerState()).toBe('Unknown')
      expect(pending.observed).toBe(false)

      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('cancels stalled wake detection reads so subsequent polls can recover', () => {
      reportStates(8)
      component.refreshPowerState()

      const pending = new Subject<{ powerstate: number }>()
      devicesService.getPowerState.mockReturnValueOnce(pending).mockReturnValue(of({ powerstate: 2 }))
      nextPoll()
      expect(pending.observed).toBe(true)

      vi.advanceTimersByTime(POWER_READ_TIMEOUT_MS)
      expect(pending.observed).toBe(false)
      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('times out a pending manual refresh and resumes wake detection', () => {
      const pending = new Subject<{ powerstate: number }>()
      devicesService.getPowerState.mockReturnValueOnce(pending).mockReturnValue(of({ powerstate: 2 }))

      component.refreshPowerState()
      expect(component.isLoading()()).toBe(true)

      vi.advanceTimersByTime(POWER_READ_TIMEOUT_MS)
      expect(pending.observed).toBe(false)
      expect(component.isLoading()()).toBe(false)
      expect(component.powerState()).toBe('Unknown')

      nextPoll()
      expect(component.powerState()).toBe(ON)
    })

    it('counts empty readings as a drop-out and requires steady on readings for recovery', () => {
      devicesService.getPowerState
        .mockReturnValueOnce(EMPTY)
        .mockReturnValueOnce(EMPTY)
        .mockReturnValue(of({ powerstate: 2 }))

      component.executePowerAction(12)
      for (let poll = 0; poll < 2 + POWER_STEADY_ON_READS - 1; poll++) {
        nextPoll()
        expect(component.powerState()).toBe(OFF)
      }

      nextPoll()
      expect(component.powerState()).toBe(ON)
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(2 + POWER_STEADY_ON_READS)
    })

    it.each([
      { body: 'empty', response: EMPTY },
      { body: 'null', response: of(null) }
    ])('resumes wake detection after a manual refresh with an $body body', ({ response }) => {
      reportStates(8)
      component.refreshPowerState()
      expect(component.powerState()).toBe(OFF)

      devicesService.getPowerState.mockReturnValue(response)
      component.refreshPowerState()
      expect(component.powerState()).toBe('Unknown')
      expect(component.isLoading()()).toBe(false)

      nextPoll()
      expect(component.powerState()).toBe('Unknown')

      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      nextPoll()
      expect(component.powerState()).toBe(ON)
      const calls = devicesService.getPowerState.mock.calls.length
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(calls)
    })

    it('recovers from Unknown by itself once the device can be read again', () => {
      devicesService.getPowerState.mockReturnValue(throwError(() => new Error('unreachable')))
      component.executePowerAction(12)
      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS)
      expect(component.powerState()).toBe('Unknown')

      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
    })

    it('recovers from a failed manual refresh by itself', () => {
      devicesService.getPowerState.mockReturnValue(throwError(() => new Error('Network error')))
      component.refreshPowerState()
      expect(component.powerState()).toBe('Unknown')

      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      vi.advanceTimersByTime(POWER_POLL_INTERVAL_MS)
      expect(component.powerState()).toBe(ON)
    })

    it('shows Unknown when the device is unreachable until the timeout', () => {
      component.powerState.set(OFF)
      devicesService.getPowerState.mockReturnValue(throwError(() => new Error('unreachable')))

      component.executePowerAction(2)
      expect(component.powerState()).toBe(OFF)

      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS)
      expect(component.powerState()).toBe('Unknown')
    })

    it.each([
      [OFF, 8],
      [SLEEP, 4]
    ])('keeps %s on power up and turns green only once the device reports on', (before, stillDown) => {
      component.powerState.set(before)
      reportStates(stillDown, stillDown, 2)

      component.executePowerAction(2)
      expect(component.powerState()).toBe(before)

      nextPoll()
      nextPoll()
      expect(component.powerState()).toBe(before)

      nextPoll()
      expect(component.powerState()).toBe(ON)
      nextPoll()
      expect(devicesService.getPowerState).toHaveBeenCalledTimes(3)
    })

    it('does not change the colour when the device rejects the action', () => {
      sendPowerActionSpy.mockReturnValue(of({ ReturnValue: 1 }))

      component.executePowerAction(12)

      expect(component.powerState()).toBe(ON)
      expect(snackBar.open).toHaveBeenCalledWith(expect.anything(), undefined, SnackbarDefaults.defaultError)
      nextPoll()
      expect(devicesService.getPowerState).not.toHaveBeenCalled()
    })

    it('does not fail when sending the action fails', () => {
      sendPowerActionSpy.mockReturnValue(throwError(() => new Error('Network error')))

      component.executePowerAction(12)

      expect(component.powerState()).toBe(ON)
      expect(snackBar.open).toHaveBeenCalledWith(expect.anything(), undefined, SnackbarDefaults.defaultError)
    })

    it('drops the pending sleep when the user refreshes manually', () => {
      devicesService.getPowerState.mockReturnValue(of({ powerstate: 2 }))
      component.executePowerAction(4)

      component.refreshPowerState()
      expect(component.powerState()).toBe(ON)

      vi.advanceTimersByTime(POWER_POLL_TIMEOUT_MS)
      expect(component.powerState()).toBe(ON)
    })

    describe('in cloud mode', () => {
      beforeEach(() => {
        component.isCloudMode = true
      })

      it('shows the expected state and keeps checking when MPS reports success', () => {
        sendPowerActionSpy.mockReturnValue(of({ Body: { ReturnValue: 0, ReturnValueStr: 'SUCCESS' } }))
        reportStates(2, 8)

        component.executePowerAction(12)
        expect(component.powerState()).toBe(ON)

        nextPoll()
        expect(component.powerState()).toBe(ON)
        nextPoll()
        expect(component.powerState()).toBe(OFF)
        expect(devicesService.getPowerState).toHaveBeenCalledTimes(2)
        expect(snackBar.open).toHaveBeenCalledWith(expect.anything(), undefined, SnackbarDefaults.defaultSuccess)
      })

      it('shows an error and keeps the colour when MPS reports a failure', () => {
        sendPowerActionSpy.mockReturnValue(
          of({ Body: { RequestPowerStateChange_OUTPUT: { ReturnValue: 36, ReturnValueStr: 'INVALID_PARAMETER' } } })
        )

        component.executePowerAction(12)

        expect(component.powerState()).toBe(ON)
        expect(snackBar.open).toHaveBeenCalledWith(expect.anything(), undefined, SnackbarDefaults.defaultError)
      })

      it('warns without changing the colour when MPS reports NOT_READY', () => {
        sendPowerActionSpy.mockReturnValue(of({ Body: { ReturnValueStr: 'NOT_READY' } }))

        component.executePowerAction(12)

        expect(component.powerState()).toBe(ON)
        expect(snackBar.open).toHaveBeenCalledWith(expect.anything(), undefined, SnackbarDefaults.defaultWarn)
      })
    })
  })

  it('should navigate to device', async () => {
    fixture.componentRef.setInput('deviceId', '12345-pokli-456772')
    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    await component.navigateTo('guid')
    expect(routerSpy).toHaveBeenCalledWith([`/devices/${component.deviceId()}/guid`])
  })

  it('should navigate to devices', async () => {
    fixture.componentRef.setInput('deviceId', '12345-pokli-456772')

    const routerSpy = vi.spyOn(component.router, 'navigate').mockImplementation((() => undefined) as any)
    vi.spyOn(component.router, 'url', 'get').mockReturnValue(`/devices/${component.deviceId()}`)
    await component.navigateTo('devices')
    expect(routerSpy).toHaveBeenCalledWith(['/devices'])
  })

  it('should send deactivate action', async () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const navigateToSpy = vi.spyOn(component, 'navigateTo').mockResolvedValue()

    component.sendDeactivate()
    await fixture.whenStable()

    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalledWith(component.deviceId())
    expect(snackBar.open).toHaveBeenCalledWith('devices.deactivation.value', undefined, SnackbarDefaults.defaultSuccess)
    expect(navigateToSpy).toHaveBeenCalledWith('devices')
    expect(component.isLoading()()).toBe(false)
  })

  it('should show an error when deactivate fails', async () => {
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const navigateToSpy = vi.spyOn(component, 'navigateTo').mockResolvedValue()
    sendDeactivateSpy.mockReturnValueOnce(throwError(() => ({ error: 'Error' })))

    component.sendDeactivate()
    await fixture.whenStable()

    expect(sendDeactivateSpy).toHaveBeenCalledWith(component.deviceId())
    expect(snackBar.open).toHaveBeenCalledWith(
      'devices.errorDeactivation.value',
      undefined,
      SnackbarDefaults.defaultError
    )
    expect(navigateToSpy).not.toHaveBeenCalled()
    expect(component.isLoading()()).toBe(false)
  })

  it('should open PBABootDialogComponent and send filtered PBA sources', () => {
    const pbaSources = [
      {
        biosBootString: 'PBA1',
        bootString: 'OemPba.efi',
        elementName: '',
        failThroughSupported: 0,
        instanceID: 'PBA1',
        structuredBootString: '',
        description: 'PBA Boot'
      },
      {
        biosBootString: 'Other',
        bootString: 'Other.efi',
        elementName: '',
        failThroughSupported: 0,
        instanceID: 'Other',
        structuredBootString: '',
        description: 'Other Boot'
      }
    ]
    devicesService.getBootSources = vi.fn().mockReturnValue(of(pbaSources))
    devicesService.getAMTVersion.mockReturnValue(
      of({ AMT_SetupAndConfigurationService: { response: { ProvisioningMode: 1 } } })
    )
    const dialogRefSpyObj = createSpyObj({
      afterClosed: of({ bootPath: 'OemPba.efi', enforceSecureBoot: true }),
      close: null
    })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)
    const executeAuthSpy = vi.spyOn(component, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)
    component.performPBABoot(107)
    expect(devicesService.getBootSources).toHaveBeenCalledWith('guid')
    expect(dialogSpy).toHaveBeenCalledWith(expect.any(Function), {
      width: '400px',
      disableClose: false,
      data: {
        pbaBootFilesPath: [
          {
            biosBootString: 'PBA1',
            bootString: 'OemPba.efi',
            elementName: '',
            failThroughSupported: 0,
            instanceID: 'PBA1',
            structuredBootString: '',
            description: 'PBA Boot'
          }
        ],
        action: 107,
        isCCM: false
      }
    })
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(executeAuthSpy).toHaveBeenCalledWith(107, false, { bootPath: 'OemPba.efi', enforceSecureBoot: true })
  })

  it('should call executeAuthorizedPowerAction for WinRE without boot details', () => {
    const executeAuthSpy = vi.spyOn(component, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)
    component.performWinREBoot(109)
    expect(executeAuthSpy).toHaveBeenCalledWith(109, false, { enforceSecureBoot: true })
  })
  it('should have OCR power option in non-cloud mode', () => {
    environment.cloud = false
    component.isCloudMode = false

    component.ngOnInit()

    const ocrOption = component.powerOptions()!.find((option: { action: number }) => option.action === 105)
    expect(ocrOption).toBeTruthy()
    expect(ocrOption?.label).toBe('powerOptions.resetToHTTPSBoot.value')
  })

  it('should open HttpbootDetailComponent dialog in non-cloud mode', () => {
    environment.cloud = false
    component.isCloudMode = false

    const dialogRefSpyObj = createSpyObj({ afterClosed: of(null), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.performHTTPBoot(105)

    expect(dialogSpy).toHaveBeenCalledWith(expect.any(Function), {
      width: '400px',
      disableClose: false,
      data: { isCCM: false }
    })
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
  })

  it('should process authorized power action for OCR with boot details', () => {
    environment.cloud = false
    component.isCloudMode = false

    const bootDetails: BootDetails = {
      url: 'http://example.com/boot.iso',
      username: 'user',
      password: 'pass',
      enforceSecureBoot: true
    }
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(bootDetails), close: null })
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    const executeAuthSpy = vi.spyOn(component, 'executeAuthorizedPowerAction').mockImplementation(() => undefined)

    component.performHTTPBoot(105)

    expect(executeAuthSpy).toHaveBeenCalledWith(105, false, bootDetails)
  })

  it('should pass isCCM true to HTTPBootDialog when device is in CCM mode (ProvisioningMode 4)', () => {
    devicesService.getAMTVersion.mockReturnValue(
      of({ AMT_SetupAndConfigurationService: { response: { ProvisioningMode: 4 } } })
    )

    const dialogRefSpyObj = createSpyObj({ afterClosed: of(null), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.performHTTPBoot(105)

    expect(dialogSpy).toHaveBeenCalledWith(expect.any(Function), {
      width: '400px',
      disableClose: false,
      data: { isCCM: true }
    })
  })

  it('should still open HTTPBootDialog with isCCM false when getAMTVersion fails', () => {
    devicesService.getAMTVersion.mockReturnValue(throwError(() => new Error('Network error')))

    const dialogRefSpyObj = createSpyObj({ afterClosed: of(null), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.performHTTPBoot(105)

    expect(dialogSpy).toHaveBeenCalledWith(expect.any(Function), {
      width: '400px',
      disableClose: false,
      data: { isCCM: false }
    })
  })

  it('should still open PBABootDialog with isCCM false when getAMTVersion fails but boot sources succeed', () => {
    devicesService.getAMTVersion.mockReturnValue(throwError(() => new Error('Network error')))

    const pbaSources = [
      {
        biosBootString: 'PBA1',
        bootString: 'OemPba.efi',
        elementName: '',
        failThroughSupported: 0,
        instanceID: 'PBA1',
        structuredBootString: ''
      }
    ]
    devicesService.getBootSources = vi.fn().mockReturnValue(of(pbaSources))
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(null), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.performPBABoot(107)

    expect(dialogSpy).toHaveBeenCalledWith(expect.any(Function), {
      width: '400px',
      disableClose: false,
      data: {
        pbaBootFilesPath: pbaSources,
        action: 107,
        isCCM: false
      }
    })
  })

  it('should pass isCCM true to PBABootDialog when device is in CCM mode (ProvisioningMode 4)', () => {
    devicesService.getAMTVersion.mockReturnValue(
      of({ AMT_SetupAndConfigurationService: { response: { ProvisioningMode: 4 } } })
    )

    const pbaSources = [
      {
        biosBootString: 'PBA1',
        bootString: 'OemPba.efi',
        elementName: '',
        failThroughSupported: 0,
        instanceID: 'PBA1',
        structuredBootString: ''
      }
    ]
    devicesService.getBootSources = vi.fn().mockReturnValue(of(pbaSources))
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(null), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.performPBABoot(107)

    expect(dialogSpy).toHaveBeenCalledWith(expect.any(Function), {
      width: '400px',
      disableClose: false,
      data: {
        pbaBootFilesPath: pbaSources,
        action: 107,
        isCCM: true
      }
    })
  })
})
