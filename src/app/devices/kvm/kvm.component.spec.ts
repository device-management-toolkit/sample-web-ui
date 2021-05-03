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
import { EventEmitter } from '@angular/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

describe('KvmComponent', () => {
  let component: KvmComponent
  let fixture: ComponentFixture<KvmComponent>
  let setAmtFeaturesSpy: jasmine.Spy
  let powerStateSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['setAmtFeatures', 'getPowerState', 'startwebSocket', 'stopwebSocket'])
    const websocketStub = {
      stopwebSocket: new EventEmitter<boolean>(false),
      connectKVMSocket: new EventEmitter<boolean>(false)
    }
    setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    powerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    await TestBed.configureTestingModule({
      imports: [SharedModule, BrowserAnimationsModule, RouterTestingModule.withRoutes([])],
      declarations: [KvmComponent],
      providers: [{ provide: DevicesService, useValue: { ...devicesService, ...websocketStub } }, {
        provide: ActivatedRoute,
        useValue: {
          params: of({ id: 'guid' })
        }
      }]
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
    expect(setAmtFeaturesSpy.calls.any()).toBe(true)
    expect(powerStateSpy.calls.any()).toBe(true)
  })
})
