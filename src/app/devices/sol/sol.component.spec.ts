/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { Component, EventEmitter, Input } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, NavigationStart, RouterEvent } from '@angular/router'
import { of, ReplaySubject } from 'rxjs'
import { SolComponent } from './sol.component'
import { DevicesService } from '../devices.service'
import { MomentModule } from 'ngx-moment'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SharedModule } from 'src/app/shared/shared.module'
import { RouterTestingModule } from '@angular/router/testing'
import SnackbarDefaults from 'src/app/shared/config/snackBarDefault'
import { AuthService } from 'src/app/auth.service'
import { MatDialog } from '@angular/material/dialog'

describe('SolComponent', () => {
  let component: SolComponent
  let fixture: ComponentFixture<SolComponent>
  let authServiceStub: any
  let setAmtFeaturesSpy: jasmine.Spy
  let getPowerStateSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let reqUserConsentCodeSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy
  let snackBarSpy: jasmine.Spy
  const eventSubject = new ReplaySubject<RouterEvent>(1)

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getPowerState', 'setAmtFeatures', 'getAMTFeatures', 'reqUserConsentCode', 'cancelUserConsentCode', 'getRedirectionExpirationToken'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(of({}))
    reqUserConsentCodeSpy = devicesService.reqUserConsentCode.and.returnValue(of({}))
    getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    tokenSpy = devicesService.getRedirectionExpirationToken.and.returnValue(of({ token: '123' }))
    authServiceStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      startwebSocket: new EventEmitter<boolean>(false)
    }

    @Component({
      selector: 'app-device-toolbar'
    })
    class TestDeviceToolbarComponent {
      @Input()
      isLoading = false

      @Input()
      deviceState: number = 0
    }

    await TestBed.configureTestingModule({
      imports: [MomentModule, BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [SolComponent, TestDeviceToolbarComponent],
      providers: [{
        provide: DevicesService,
        useValue: { ...devicesService, ...authServiceStub }
      },
      {
        provide: ActivatedRoute,
        useValue: { params: of({ id: 'guid' }) }
      },
      {
        provide: AuthService,
        useValue: authServiceStub
      }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(SolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    snackBarSpy = spyOn(component.snackBar, 'open')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(tokenSpy).toHaveBeenCalled()
    expect(getPowerStateSpy).toHaveBeenCalled()
    expect(setAmtFeaturesSpy).toHaveBeenCalled()
    expect(getAMTFeaturesSpy).toHaveBeenCalled()
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
  it('should have correct state on websocket events', () => {
    authServiceStub.startwebSocket.emit(true)
    expect(component.isLoading).toBeFalse()
    expect(setAmtFeaturesSpy).toHaveBeenCalled()
    authServiceStub.stopwebSocket.emit(true)
    expect(component.isDisconnecting).toBeTruthy()
    expect(setAmtFeaturesSpy).toHaveBeenCalled()
  })
  it('should show error and hide loading when disconnected', () => {
    component.isDisconnecting = false
    component.deviceStatus(0)
    expect(snackBarSpy).toHaveBeenCalledOnceWith('Connecting to SOL failed. Only one session per device is allowed. Also ensure that your token is valid and you have access.', undefined, SnackbarDefaults.defaultError)
    expect(component.isLoading).toBeFalse()
    expect(component.deviceState).toBe(0)
  })
  it('should not show error and hide loading when isDisconnecting is true', () => {
    component.isDisconnecting = true
    component.deviceStatus(0)
    expect(snackBarSpy).not.toHaveBeenCalled()
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
  it('should show dialog when called (cancel)', () => {
    const cancelSpy = spyOn(component, 'cancelUserConsentCode')
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(null), close: null })
    spyOn(TestBed.get(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    component.userConsentDialog()
    fixture.detectChanges()
    expect(cancelSpy).toHaveBeenCalled()
  })
})
