/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { MatDialog } from '@angular/material/dialog'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { ConfigsComponent } from './configs.component'
import { ConfigsService } from './configs.service'
import { RouterModule } from '@angular/router'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { provideHttpClientTesting } from '@angular/common/http/testing'

describe('ConfigsComponent', () => {
  let component: ConfigsComponent
  let fixture: ComponentFixture<ConfigsComponent>
  let getDataSpy: jasmine.Spy
  let deleteSpy: jasmine.Spy
  let translate: TranslateService

  // Factory function for the TranslateHttpLoader
  function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json')
  }

  beforeEach(async () => {
    const configsService = jasmine.createSpyObj('ConfigsService', ['getData', 'delete'])
    getDataSpy = configsService.getData.and.returnValue(
      of({
        data: [
          {
            authMethod: 2,
            commonName: '52.172.14.137',
            configName: 'ciraconfig1',
            generateRandomPassword: false,
            mpsPort: 4433,
            mpsRootCertificate: 'string',
            mpsServerAddress: '52.172.14.137',
            passwordLength: null,
            proxyDetails: null,
            serverAddressFormat: 3
          }
        ],
        totalCount: 1
      })
    )
    deleteSpy = configsService.delete.and.returnValue(of(null))
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterModule,
        ConfigsComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
      ],
      providers: [
        { provide: ConfigsService, useValue: configsService },
        TranslateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigsComponent)
    component = fixture.componentInstance
    translate = TestBed.inject(TranslateService)
    translate.setDefaultLang('en')
    fixture.detectChanges()
  })

  afterEach(() => {
    TestBed.resetTestingModule()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(getDataSpy.calls.any()).toBe(true, 'getData called')
  })

  it('should change the page', () => {
    component.pageChanged({ pageSize: 25, pageIndex: 2, length: 50 })
    expect(getDataSpy.calls.any()).toBe(true, 'getData called')
    expect(component.paginator.length).toBe(1)
    expect(component.paginator.pageSize).toBe(25)
    expect(component.paginator.pageIndex).toBe(0)
    expect(component.paginator.showFirstLastButtons).toBe(true)
  })

  it('should navigate to existing', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo('path')
    expect(routerSpy).toHaveBeenCalledWith(['/ciraconfigs', 'path'])
  })

  it('should navigate to new', async () => {
    const routerSpy = spyOn(component.router, 'navigate')
    await component.navigateTo()
    expect(routerSpy).toHaveBeenCalledWith(['/ciraconfigs', 'new'])
  })

  it('should delete', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null })
    const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogRefSpyObj)
    const snackBarSpy = spyOn(component.snackBar, 'open')

    component.delete('ciraconfig1')
    expect(dialogSpy).toHaveBeenCalled()
    fixture.detectChanges()
    expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled()
    expect(deleteSpy).toHaveBeenCalled()
    expect(snackBarSpy).toHaveBeenCalled()
  })
})
