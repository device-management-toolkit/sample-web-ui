/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { DevicesService } from '../devices.service'
import { DeviceToolbarComponent } from './device-toolbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
import { MatDialog } from '@angular/material/dialog'
import { BootDetails, Device } from 'src/models/models'
import { EventEmitter } from '@angular/core'
import { environment } from 'src/environments/environment'
import { MatSnackBar } from '@angular/material/snack-bar'

describe('DeviceToolbarComponent', () => {
  let component: DeviceToolbarComponent
  let fixture: ComponentFixture<DeviceToolbarComponent>
  let sendPowerActionSpy: jasmine.Spy
  let getDeviceSpy: jasmine.Spy
  let sendDeactivateSpy: jasmine.Spy
  let sendDeactivateErrorSpy: jasmine.Spy
  let devicesService: jasmine.SpyObj<DevicesService>
  let snackBar: jasmine.SpyObj<MatSnackBar>

  const isCloudMode = environment.cloud

  beforeEach(async () => {
    // Create a spy for the snackBar service
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open'])

    devicesService = jasmine.createSpyObj('DevicesService', [
      'sendPowerAction',
      'getDevice',
      'sendDeactivate',
      'getPowerState',
      'getAMTFeatures'
    ])
    devicesService.deviceState = new EventEmitter<number>()

    devicesService.TargetOSMap = { 0: 'Unknown' } as any
    sendPowerActionSpy = devicesService.sendPowerAction.and.returnValue(
      of({
        Body: {
          ReturnValueStr: 'NOT_READY'
        }
      })
    )

    devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    devicesService.getAMTFeatures.and.returnValue(
      of({
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
        remoteErase: true
      } as any)
    )
    getDeviceSpy = devicesService.getDevice.and.returnValue(of({ guid: 'guid' } as any))
    sendDeactivateSpy = devicesService.sendDeactivate.and.returnValue(of({ status: 'SUCCESS' }))
    sendDeactivateErrorSpy = devicesService.sendDeactivate.and.returnValue(throwError({ error: 'Error' }))
    devicesService.device = new Subject<Device>()

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        DeviceToolbarComponent
      ],
      providers: [
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
    expect(component.isLoading()()).toBeFalse()
  })

  it('should navigate to device', async () => {
    fixture.componentRef.setInput('deviceId', '12345-pokli-456772')
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('guid')
    expect(routerSpy).toHaveBeenCalledWith([`/devices/${component.deviceId()}/guid`])
  })

  it('should navigate to devices', async () => {
    fixture.componentRef.setInput('deviceId', '12345-pokli-456772')

    const routerSpy = spyOn(component.router, 'navigate')
    spyOnProperty(component.router, 'url', 'get').and.returnValue(`/devices/${component.deviceId()}`)
    await component.navigateTo('devices')
    expect(routerSpy).toHaveBeenCalledWith(['/devices'])
  })

  it('should send deactivate action', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.sendDeactivate()
    expect(dialogSpy).toHaveBeenCalled()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(sendDeactivateSpy).toHaveBeenCalled()
    expect(sendDeactivateErrorSpy).toHaveBeenCalled()
  })

  it('should have OCR power option in non-cloud mode', () => {
    environment.cloud = false
    component.isCloudMode = false

    component.ngOnInit()

    const ocrOption = component.powerOptions.find((option) => option.action === 105)
    expect(ocrOption).toBeTruthy()
    expect(ocrOption?.label).toBe('Reset to HTTPS Boot (OCR)')
  })

  it('should not have OCR power option in cloud mode', () => {
    environment.cloud = true
    component.isCloudMode = true

    component.ngOnInit()

    const ocrOption = component.powerOptions.find((option) => option.action === 105)
    expect(ocrOption).toBeFalsy()
  })

  it('should open HttpbootDetailComponent dialog in non-cloud mode', () => {
    environment.cloud = false
    component.isCloudMode = false

    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(null), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    component.performHTTPBoot(105)

    expect(dialogSpy).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '400px',
      disableClose: false
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
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(bootDetails), close: null })
    spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)

    const executeAuthSpy = spyOn(component, 'executeAuthorizedPowerAction').and.stub()

    component.performHTTPBoot(105)

    expect(executeAuthSpy).toHaveBeenCalledWith(105, false, bootDetails)
  })
})
