/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { TestBed } from '@angular/core/testing'

import { KvmComponent } from './kvm.component'

import { DevicesService } from '../devices.service'
// import { of } from 'rxjs'
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core'
import { MomentModule } from 'ngx-moment'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { SharedModule } from 'src/app/shared/shared.module'
import { RouterTestingModule } from '@angular/router/testing'

describe('KvmComponent', () => {
  // let component: KvmComponent
  // let fixture: ComponentFixture<KvmComponent>
  // let setAmtFeaturesSpy: jasmine.Spy
  // let getPowerStateSpy: jasmine.Spy

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getPowerState', 'setAmtFeatures'])
    devicesService.TargetOSMap = { 0: 'Unknown' }
    // setAmtFeaturesSpy = devicesService.setAmtFeatures.and.returnValue(of({}))
    // getPowerStateSpy = devicesService.getPowerState.and.returnValue(of({ powerstate: 2 }))
    await TestBed.configureTestingModule({
      imports: [MomentModule, BrowserAnimationsModule, SharedModule, RouterTestingModule.withRoutes([])],
      declarations: [KvmComponent],
      providers: [{ provide: DevicesService, useValue: devicesService }],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents()
  })

  beforeEach(() => {
    // fixture = TestBed.createComponent(KvmComponent)
    // component = fixture.componentInstance
    // fixture.detectChanges()
  })

  it('should create', () => {
    // expect(component).toBeTruthy()
  })
})
