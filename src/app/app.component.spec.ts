/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { EventEmitter, Component, input } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideHttpClient } from '@angular/common/http'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
// import { MQTTService } from './event-channel/event-channel.service'

@Component({
  selector: 'app-toolbar',
  imports: [RouterModule, MatSidenavModule]
})
class TestToolbarComponent {
  readonly isLoading = input(false)
}

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>
  let translate: TranslateService

  // const eventChannelStub = {
  //   connect: jasmine.createSpy('connect'),
  //   subscribeToTopic: jasmine.createSpy('connect'),
  //   destroy: jasmine.createSpy('destroy')
  // }

  beforeEach(() => {
    const authServiceStub = {
      loggedInSubject: new EventEmitter<boolean>()
    }

    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        MatSidenavModule,
        TestToolbarComponent,
        AppComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: Router,
          useValue: {
            events: of({})
          }
        },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
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
