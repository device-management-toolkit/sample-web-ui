/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { NavbarComponent } from './navbar.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { of, throwError } from 'rxjs'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { ServerFeaturesService } from '../../server-features.service'

describe('NavbarComponent', () => {
  let component: NavbarComponent
  let fixture: ComponentFixture<NavbarComponent>
  let translate: TranslateService
  let serverFeaturesSpy: jasmine.SpyObj<ServerFeaturesService>

  beforeEach(() => {
    serverFeaturesSpy = jasmine.createSpyObj('ServerFeaturesService', ['getFeatures'])
    serverFeaturesSpy.getFeatures.and.returnValue(of({ ciraEnabled: true }))
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        MatDividerModule,
        MatListModule,
        RouterModule,
        NavbarComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ id: 'guid' }) } },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        { provide: ServerFeaturesService, useValue: serverFeaturesSpy },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    fixture = TestBed.createComponent(NavbarComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should not query server features in cloud mode and keep the CIRA tab enabled', () => {
    component.cloudMode = true
    serverFeaturesSpy.getFeatures.calls.reset()
    component.ngOnInit()
    expect(serverFeaturesSpy.getFeatures).not.toHaveBeenCalled()
    expect(component.ciraEnabled()).toBeTrue()
  })

  it('should disable the CIRA tab when the server reports CIRA disabled (enterprise mode)', () => {
    component.cloudMode = false
    serverFeaturesSpy.getFeatures.and.returnValue(of({ ciraEnabled: false }))
    fixture.detectChanges()
    expect(serverFeaturesSpy.getFeatures).toHaveBeenCalled()
    expect(component.ciraEnabled()).toBeFalse()
    expect(fixture.nativeElement.querySelector('a[routerlink="/ciraconfigs"]')).toBeNull()
  })

  it('should enable the CIRA tab when the server reports CIRA enabled (enterprise mode)', () => {
    component.cloudMode = false
    serverFeaturesSpy.getFeatures.and.returnValue(of({ ciraEnabled: true }))
    fixture.detectChanges()
    expect(component.ciraEnabled()).toBeTrue()
    expect(fixture.nativeElement.querySelector('a[routerlink="/ciraconfigs"]')).not.toBeNull()
  })

  it('should fail open and keep the CIRA tab enabled when the features call errors (enterprise mode)', () => {
    component.cloudMode = false
    serverFeaturesSpy.getFeatures.and.returnValue(throwError(() => new Error('failed')))
    component.ngOnInit()
    expect(component.ciraEnabled()).toBeTrue()
  })
})
