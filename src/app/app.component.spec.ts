/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { EventEmitter, Component, Input } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'
// import { MQTTService } from './event-channel/event-channel.service'

@Component({
  selector: 'app-toolbar',
  imports: [RouterModule, MatSidenavModule]
})
class TestToolbarComponent {
  @Input()
  isLoading = false
}

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  // const eventChannelStub = {
  //   connect: jasmine.createSpy('connect'),
  //   subscribeToTopic: jasmine.createSpy('connect'),
  //   destroy: jasmine.createSpy('destroy')
  // }

  beforeEach(async () => {
    const authServiceStub = {
      loggedInSubject: new EventEmitter<boolean>()
    }

    await TestBed.configureTestingModule({
      imports: [
        RouterModule,
        MatSidenavModule,
        TestToolbarComponent,
        AppComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: Router,
          useValue: {
            events: of({})
          }
        }
      ]
    }).compileComponents()
    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create the app', () => {
    expect(component).toBeTruthy()
    // expect(component.mqttService.connect).toHaveBeenCalled()
    // expect(component.mqttService.subscribeToTopic).toHaveBeenCalledWith('mps/#')
    // expect(component.mqttService.subscribeToTopic).toHaveBeenCalledWith('rps/#')
    expect(component.isLoggedIn).toBeFalse()
  })
})
