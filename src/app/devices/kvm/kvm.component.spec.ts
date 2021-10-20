/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { KvmComponent } from './kvm.component'

import { DevicesService } from '../devices.service'
import { of } from 'rxjs'
import { SharedModule } from 'src/app/shared/shared.module'
import { ActivatedRoute } from '@angular/router'
import { Component, EventEmitter, Input } from '@angular/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AuthService } from 'src/app/auth.service'

describe('KvmComponent', () => {
  let component: KvmComponent
  let fixture: ComponentFixture<KvmComponent>
  let setAmtFeaturesSpy: jasmine.Spy
  let powerStateSpy: jasmine.Spy
  let getAMTFeaturesSpy: jasmine.Spy
  let reqUserConsentCodeSpy: jasmine.Spy
  let tokenSpy: jasmine.Spy

  @Component({
    selector: 'app-device-toolbar'
  })
  class TestDeviceToolbarComponent {
    @Input()
    isLoading = false

    @Input()
    deviceState: number = 0
  }

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['setAmtFeatures', 'getPowerState', 'startwebSocket', 'stopwebSocket', 'getAMTFeatures', 'reqUserConsentCode', 'cancelUserConsentCode'])

    const websocketStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      connectKVMSocket: new EventEmitter<boolean>(false)
    }
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    getAMTFeaturesSpy = devicesService.getAMTFeatures.and.returnValue(of({}))
    reqUserConsentCodeSpy = devicesService.reqUserConsentCode.and.returnValue(of({}))
    powerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    const authService = jasmine.createSpyObj('AuthService', ['getLoggedUserToken'])
    tokenSpy = authService.getLoggedUserToken.and.returnValue('123')

    await TestBed.configureTestingModule({
      imports: [SharedModule, BrowserAnimationsModule, RouterTestingModule.withRoutes([])],
      declarations: [KvmComponent, TestDeviceToolbarComponent],
      providers: [{ provide: DevicesService, useValue: { ...devicesService, ...websocketStub } }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }, { provide: AuthService, useValue: authService }]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(KvmComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(tokenSpy).toHaveBeenCalled()
    expect(setAmtFeaturesSpy).toHaveBeenCalled()
    expect(powerStateSpy).toHaveBeenCalled()
    expect(getAMTFeaturesSpy).toHaveBeenCalled()
    expect(reqUserConsentCodeSpy).toHaveBeenCalled()
  })
})
