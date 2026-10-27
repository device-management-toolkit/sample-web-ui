/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router, RouterModule } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { BidiModule } from '@angular/cdk/bidi'
import { provideHttpClient } from '@angular/common/http'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
// import { MQTTService } from './event-channel/event-channel.service'

@Component({
  template: '',
  selector: 'app-navbar'
})
class TestNavbarComponent {}

@Component({
  template: '',
  selector: 'app-nav-footer'
})
class TestNavFooterComponent {}

describe('AppComponent', () => {
  let component: AppComponent
  let fixture: ComponentFixture<AppComponent>
  let translate: TranslateService
  let loggedIn: BehaviorSubject<boolean>

  // const eventChannelStub = {
  //   connect: vi.fn(),
  //   subscribeToTopic: vi.fn(),
  //   destroy: vi.fn()
  // }

  beforeEach(() => {
    loggedIn = new BehaviorSubject<boolean>(false)
    const authServiceStub = {
      canActivateProtectedRoutes$: loggedIn
    }

    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        MatSidenavModule,
        AppComponent
      ],
      providers: [
        provideTranslateService(),
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
    TestBed.overrideComponent(AppComponent, {
      set: {
        imports: [
          MatSidenavModule,
          BidiModule,
          TestNavbarComponent,
          TestNavFooterComponent
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA]
      }
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
    expect(component.canAccessApp()).toBe(false)
  })

  it('should show no sidenav or nav footer before login', () => {
    fixture.detectChanges()

    const root: HTMLElement = fixture.nativeElement
    expect(root.querySelector('mat-sidenav')).toBeNull()
    expect(root.querySelector('app-nav-footer')).toBeNull()
  })

  it('should show the nav footer in the sidenav after login', () => {
    fixture.detectChanges()

    loggedIn.next(true)
    fixture.detectChanges()

    const root: HTMLElement = fixture.nativeElement
    expect(root.querySelector('mat-sidenav app-nav-footer')).not.toBeNull()
    expect(root.querySelectorAll('app-nav-footer').length).toBe(1)
  })
})
