/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
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
        BrowserAnimationsModule,
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
