/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { EventEmitter, Component, Input } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'
import { MQTTService } from './event-channel/event-channel.service'

@Component({
  selector: 'app-toolbar'
})
class TestToolbarComponent {
  @Input()
    isLoading = false
}

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  const eventChannelStub = {
    connect: jasmine.createSpy('connect'),
    subscribeToTopic: jasmine.createSpy('connect'),
    destroy: jasmine.createSpy('destroy')
  }

  beforeEach(async () => {
    const authServiceStub = {
      loggedInSubject: new EventEmitter<boolean>()
    }

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, MatSidenavModule
      ],
      declarations: [
        AppComponent, TestToolbarComponent
      ],
      providers: [{ provide: AuthService, useValue: authServiceStub }, {
        provide: Router,
        useValue: {
          events: of({})
        }
      },
      { provide: MQTTService, useValue: eventChannelStub }]

    }).compileComponents()
    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  it('should create the app', () => {
    expect(component).toBeTruthy()
    expect(component.mqttService.connect).toHaveBeenCalled()
    expect(component.mqttService.subscribeToTopic).toHaveBeenCalledWith('mps/#')
    expect(component.mqttService.subscribeToTopic).toHaveBeenCalledWith('rps/#')
    expect(component.isLoggedIn).toBeFalse()
  })
})
