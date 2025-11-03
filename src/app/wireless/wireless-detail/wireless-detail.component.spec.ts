/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of } from 'rxjs'
import { WirelessService } from '../wireless.service'
import { WirelessDetailComponent } from './wireless-detail.component'
import { IEEE8021xService } from '../../ieee8021x/ieee8021x.service'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'

describe('WirelessDetailComponent', () => {
  let component: WirelessDetailComponent
  let fixture: ComponentFixture<WirelessDetailComponent>
  let wirelessSpy: jasmine.Spy
  let wirelessCreateSpy: jasmine.Spy
  let wirelessUpdateSpy: jasmine.Spy
  let routerSpy: jasmine.Spy
  let translate: TranslateService

  beforeEach(() => {
    const wirelessService = jasmine.createSpyObj('WirelessService', [
      'getRecord',
      'update',
      'create'
    ])
    wirelessSpy = wirelessService.getRecord.and.returnValue(of({}))
    wirelessCreateSpy = wirelessService.create.and.returnValue(of({}))
    wirelessUpdateSpy = wirelessService.update.and.returnValue(of({}))
    const ieee8021xService = jasmine.createSpyObj('IEEE8021xService', ['getData'])
    ieee8021xService.getData.and.returnValue(
      of({
        data: [
          {
            profileName: '8021xConfig',
            authenticationProtocol: 0, // EAP-TLS
            pxeTimeout: 0,
            wiredInterface: false,
            version: 'one'
          }
        ],
        totalCount: 1
      })
    )
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        WirelessDetailComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: WirelessService, useValue: wirelessService },
        { provide: IEEE8021xService, useValue: ieee8021xService },
        { provide: ActivatedRoute, useValue: { params: of({ name: 'profile' }) } },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(WirelessDetailComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
    routerSpy = spyOn(component.router, 'navigate')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(wirelessSpy).toHaveBeenCalled()
  })

  it('should cancel', async () => {
    await component.cancel()
    expect(routerSpy).toHaveBeenCalledWith(['/wireless'])
  })
  it('should submit when valid (update)', () => {
    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 4,
      encryptionMethod: 3,
      ssid: 'ssid1234',
      pskPassphrase: 'passphrase1'
    })
    component.onSubmit()

    expect(wirelessUpdateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should not submit if missing PSKPassphrase', () => {
    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 4, // WPA PSK
      encryptionMethod: 3, // TKIP
      ssid: 'ssid1234'
    })
    component.onSubmit()
    expect(wirelessUpdateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
    component.wirelessForm.patchValue({
      authenticationMethod: 6 // WPA2 PSK
    })
    component.onSubmit()
    expect(wirelessUpdateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should not submit if missing ieee8021x', () => {
    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 5, // WPA IEEE8021X
      encryptionMethod: 3, // TKIP
      ssid: 'ssid1234'
    })
    component.onSubmit()
    expect(wirelessUpdateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
    component.wirelessForm.patchValue({
      authenticationMethod: 7 // WPA2 IEEE8021X
    })
    component.onSubmit()
    expect(wirelessUpdateSpy).not.toHaveBeenCalled()
    expect(routerSpy).not.toHaveBeenCalled()
  })

  it('should submit when valid (create)', () => {
    component.isEdit = false
    component.wirelessForm.patchValue({
      profileName: 'profile1',
      authenticationMethod: 4, // WPA PSK
      encryptionMethod: 3, // TKIP
      ssid: 'ssid1234',
      pskPassphrase: 'passphrase1'
    })
    component.onSubmit()

    expect(wirelessCreateSpy).toHaveBeenCalled()
    expect(routerSpy).toHaveBeenCalled()
  })

  it('should turn psk pass visibility on when it is off', () => {
    component.pskInputType = 'password'
    component.togglePSKPassVisibility()

    expect(component.pskInputType).toEqual('text')
  })

  it('should turn psk pass visibility off when it is on', () => {
    component.pskInputType = 'text'
    component.togglePSKPassVisibility()

    expect(component.pskInputType).toEqual('password')
  })

  it('should support PSK passphrase and ieee8021x visibility', () => {
    component.onAuthenticationMethodChange(4) // WPA PSK
    expect(component.showPSKPassPhrase).toBeTrue()
    expect(component.showIEEE8021x).toBeFalse()
    component.onAuthenticationMethodChange(6) // WPA2 PSK
    expect(component.showPSKPassPhrase).toBeTrue()
    expect(component.showIEEE8021x).toBeFalse()
    component.onAuthenticationMethodChange(5) // WPA IEEE8021X
    expect(component.showPSKPassPhrase).toBeFalse()
    expect(component.showIEEE8021x).toBeTrue()
    component.onAuthenticationMethodChange(7) // WPA2 IEEE8021X
    expect(component.showPSKPassPhrase).toBeFalse()
    expect(component.showIEEE8021x).toBeTrue()
  })
})
