/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { EventEmitter, Component, Input } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { IMqttMessage, IMqttServiceOptions, MqttService } from 'ngx-mqtt'
import { of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'
import { EventChannelService } from './event-channel/event-channel.service'

@Component({
  selector: 'app-toolbar'
})
class TestToolbarComponent {
  @Input()
  isLoading = false
}

describe('AppComponent', () => {
  let observeSpy: jasmine.Spy
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>

  const data = {
    topic: 'mps/events',
    qos: 0,
    retain: false,
    dup: false,
    payload: JSON.stringify({
      guid: 'd12428be-9fa1-4226-9784-54b2038beab6',
      message: 'Sent Power State',
      methods: ['AMT_PowerState'],
      timestamp: 1632390720490,
      type: 'success'
    })
  }
  const eventChannelStub = {
    reconnectMqttService: new EventEmitter<IMqttServiceOptions>(),
    processMessage: (message: IMqttMessage) => {},
    refreshData: () => {}
  }

  beforeEach(async () => {
    const authServiceStub = {
      loggedInSubject: new EventEmitter<boolean>()
    }

    const mqttservice = jasmine.createSpyObj('MqttService', ['observe', 'connect'])
    observeSpy = mqttservice.observe.and.returnValue(of(data))
    mqttservice.state = { subscribe: () => of(2) }
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
      }, { provide: MqttService, useValue: mqttservice }, { provide: EventChannelService, useValue: eventChannelStub }]

    }).compileComponents()
    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
  })

  it('should create the app', () => {
    eventChannelStub.reconnectMqttService.emit({ hostname: 'localhost', port: 9004, path: '/mqtt' })
    console.log(localStorage.getItem('oact_config'), '++++++')
    expect(component).toBeTruthy()
    expect(observeSpy).toHaveBeenCalled()
    if (localStorage.getItem('oact_config') !== JSON.stringify({ hostname: 'localhost', port: 9004, path: '/mqtt' })) {
      expect(component.isDefault).toBeFalse()
    }
    expect(component.isLoggedIn).toBeFalse()
  })
})
