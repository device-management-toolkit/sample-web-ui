/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from '@angular/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router, RouterModule } from '@angular/router'
import { BehaviorSubject, of } from 'rxjs'
import { AppComponent } from './app.component'
import { AuthService } from './auth.service'
import { provideTranslateService, TranslatePipe, TranslateService } from '@ngx-translate/core'
import { BidiModule } from '@angular/cdk/bidi'
import { provideHttpClient } from '@angular/common/http'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { LayoutService } from './core/layout.service'
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
  let layoutServiceStub: {
    isHandset: ReturnType<typeof signal<boolean>>
    opened: ReturnType<typeof signal<boolean>>
    immersive: ReturnType<typeof signal<boolean>>
    toggle: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    setImmersive: ReturnType<typeof vi.fn>
  }

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
    layoutServiceStub = {
      isHandset: signal(false),
      opened: signal(false),
      immersive: signal(false),
      toggle: vi.fn(),
      close: vi.fn(),
      setImmersive: vi.fn()
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
        { provide: LayoutService, useValue: layoutServiceStub },
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
          TranslatePipe,
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

  describe('Responsive sidenav', () => {
    it('uses mode="side" and stays opened when not a handset', () => {
      loggedIn.next(true)
      layoutServiceStub.isHandset.set(false)
      fixture.detectChanges()

      const sidenav = fixture.debugElement.query((d) => d.name === 'mat-sidenav').componentInstance
      expect(sidenav.mode).toBe('side')
      expect(sidenav.opened).toBe(true)
    })

    it('uses mode="over" and tracks layout.opened() when a handset', () => {
      loggedIn.next(true)
      layoutServiceStub.isHandset.set(true)
      layoutServiceStub.opened.set(false)
      fixture.detectChanges()

      const sidenav = fixture.debugElement.query((d) => d.name === 'mat-sidenav').componentInstance
      expect(sidenav.mode).toBe('over')
      expect(sidenav.opened).toBe(false)

      layoutServiceStub.opened.set(true)
      fixture.detectChanges()
      expect(sidenav.opened).toBe(true)
    })

    it('shows the mobile top bar only when handset, logged in, and not immersive', () => {
      loggedIn.next(true)
      layoutServiceStub.isHandset.set(false)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.mobile-topbar')).toBeNull()

      layoutServiceStub.isHandset.set(true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.mobile-topbar')).not.toBeNull()

      layoutServiceStub.immersive.set(true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.mobile-topbar')).toBeNull()
    })

    it('toggles the drawer when the mobile top bar menu button is clicked', () => {
      loggedIn.next(true)
      layoutServiceStub.isHandset.set(true)
      fixture.detectChanges()

      const menuButton: HTMLButtonElement = fixture.nativeElement.querySelector('.mobile-topbar button')
      menuButton.click()
      expect(layoutServiceStub.toggle).toHaveBeenCalledOnce()
    })

    it('onNavbarNavigate() closes the drawer only on handset', () => {
      layoutServiceStub.isHandset.set(false)
      component.onNavbarNavigate()
      expect(layoutServiceStub.close).not.toHaveBeenCalled()

      layoutServiceStub.isHandset.set(true)
      component.onNavbarNavigate()
      expect(layoutServiceStub.close).toHaveBeenCalledOnce()
    })
  })
})
