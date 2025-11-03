/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { DevicesService } from '../devices/devices.service'
import { DashboardComponent } from './dashboard.component'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('DashboardComponent', () => {
  let component: DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>
  let getStatsSpy: jasmine.Spy
  let translate: TranslateService

  beforeEach(async () => {
    const devicesService = jasmine.createSpyObj('DevicesService', ['getStats'])

    getStatsSpy = devicesService.getStats.and.returnValue(of({}))
    TestBed.configureTestingModule({
      imports: [
        RouterModule,
        DashboardComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        {
          provide: ActivatedRoute,
          useValue: {}
        },
        { provide: TRANSLATE_HTTP_LOADER_CONFIG, useValue: { prefix: '/assets/i18n/', suffix: '.json' } },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setFallbackLang('en')
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getStatsSpy).toHaveBeenCalled()
  })
})
