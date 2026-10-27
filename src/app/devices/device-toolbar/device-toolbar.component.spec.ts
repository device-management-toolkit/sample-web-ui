/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { Device } from '../../../models/models'
import { EventEmitter } from '@angular/core'
import { environment } from '../../../environments/environment'
import { MatSnackBar } from '@angular/material/snack-bar'
import { provideTranslateService } from '@ngx-translate/core'
import SnackbarDefaults from '../../shared/config/snackBarDefault'
import { PowerActionService } from '../power-action.service'
import { signal } from '@angular/core'

describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let getDeviceSpy: MockInstance
  let sendDeactivateSpy: MockInstance
  let devicesService: SpyObj<DevicesService>
  let powerActionService: SpyObj<PowerActionService>
  let snackBar: SpyObj<MatSnackBar>

  const isCloudMode = environment.cloud

  beforeEach(async () => {
    snackBar = createSpyObj('MatSnackBar', ['open'])

    devicesService = createSpyObj('DevicesService', [
      'getDevice',
      'sendDeactivate',
      'getAMTFeaturesCached',
      'featuresChanges',
      'getDeviceCertificate'
    ])
    devicesService.featuresChanges.mockReturnValue(of(null))
    devicesService.deviceState = new EventEmitter<number>()

    const mockAMTFeatures = { userConsent: 'None', ocr: true, httpsBootSupported: true } as any
    devicesService.getAMTFeaturesCached.mockReturnValue(of(mockAMTFeatures))
    getDeviceSpy = devicesService.getDevice.mockReturnValue(of({ guid: 'guid' } as any))
    sendDeactivateSpy = devicesService.sendDeactivate.mockReturnValue(of({ status: 'SUCCESS' }))
    devicesService.device = new Subject<Device>()

    powerActionService = createSpyObj('PowerActionService', [
      'loadPowerState',
      'refreshPowerState',
      'sendPowerAction',
      'buildPowerOptions'
    ])
    powerActionService.powerState = signal('Unknown') as any
    powerActionService.buildPowerOptions.mockReturnValue([{ label: 'powerOptions.resetToHTTPSBoot.value', action: 105 }])

    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        DeviceToolbarComponent
      ],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesService },
        { provide: PowerActionService, useValue: powerActionService },
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

  it('should load power state through PowerActionService on init', () => {
    expect(powerActionService.loadPowerState).toHaveBeenCalledWith('guid', component.isLoading())
  })

  it('should build power options from AMT features through PowerActionService', () => {
    expect(powerActionService.buildPowerOptions).toHaveBeenCalledWith({ userConsent: 'None', ocr: true, httpsBootSupported: true })
    expect(component.powerOptions()).toEqual([{ label: 'powerOptions.resetToHTTPSBoot.value', action: 105 }])
  })

  it('should delegate send power action to PowerActionService', () => {
    component.sendPowerAction(4)
    expect(powerActionService.sendPowerAction).toHaveBeenCalledWith('guid', 4, component.isLoading())
  })

  it('should delegate refresh power state to PowerActionService', () => {
    component.refreshPowerState()
    expect(powerActionService.refreshPowerState).toHaveBeenCalledWith('guid', component.isLoading())
  })

  it('should expose the shared power state signal from PowerActionService', () => {
    expect(component.powerState).toBe(powerActionService.powerState)
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

  it('should fetch and pin the device certificate', async () => {
    devicesService.getDeviceCertificate.mockReturnValue(of({ cert: 'data' } as any))
    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.getDeviceCert()
    await fixture.whenStable()

    expect(devicesService.getDeviceCertificate).toHaveBeenCalledWith('guid')
    expect(dialogSpy).toHaveBeenCalled()
    expect(component.isPinned()).toBe(true)
  })

  it('should reload the page after editing a device in non-cloud mode', async () => {
    environment.cloud = false
    component.isCloudMode = false
    const reloadSpy = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: reloadSpy })

    const dialogRefSpyObj = createSpyObj({ afterClosed: of(true), close: null })
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(dialogRefSpyObj)

    component.editDevice()
    await fixture.whenStable()

    expect(reloadSpy).toHaveBeenCalled()
    expect(snackBar.open).toHaveBeenCalledWith('Device updated successfully', undefined, SnackbarDefaults.defaultSuccess)
    vi.unstubAllGlobals()
  })
})
