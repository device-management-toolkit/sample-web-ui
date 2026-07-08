/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, provideRouter } from '@angular/router'
import { ReplaySubject, of } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceDetailComponent } from './device-detail.component'
import { provideNativeDateAdapter } from '@angular/material/core'
import { Component, signal, input } from '@angular/core'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { GeneralComponent } from '../general/general.component'
import { IderComponent } from '../ider/ider.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let routeParams$: ReplaySubject<any>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  const makeAmtVersion = (sku: string) => ({
    CIM_SoftwareIdentity: {
      responses: [
        {},
        {},
        {},
        {},
        { VersionString: sku }
      ]
    }
  })

  @Component({
    selector: 'app-device-toolbar',
    imports: []
  })
  class TestDeviceToolbarComponent {
    readonly isLoading = input(signal(false))

    public readonly deviceId = input('')
  }
  @Component({
    selector: 'app-general',
    imports: []
  })
  class TestGeneralComponent {
    readonly isLoading = input(signal(false))

    public readonly deviceId = input('')
  }

  @Component({
    selector: 'app-ider',
    imports: []
  })
  class TestIderComponent {
    public readonly deviceId = input('')
  }

  beforeEach(() => {
    routeParams$ = new ReplaySubject<any>(1)
    devicesServiceSpy = jasmine.createSpyObj('DevicesService', ['getAMTVersion'])
    devicesServiceSpy.getAMTVersion.and.returnValue(of(makeAmtVersion('16400') as any))

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DeviceDetailComponent,
        TestDeviceToolbarComponent
      ],
      providers: [
        provideTranslateService(),
        provideRouter([]), // Provide an empty router configuration
        provideNativeDateAdapter(),
        { provide: DevicesService, useValue: devicesServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable()
          }
        }
      ]
    }).overrideComponent(DeviceDetailComponent, {
      remove: { imports: [
          DeviceToolbarComponent,
          GeneralComponent,
          IderComponent
        ] },
      add: { imports: [
          TestDeviceToolbarComponent,
          TestGeneralComponent,
          TestIderComponent
        ] }
    })

    fixture = TestBed.createComponent(DeviceDetailComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    routeParams$.next({ id: 'guid' })
    fixture.detectChanges()
    expect(component).toBeTruthy()
    expect(devicesServiceSpy.getAMTVersion).toHaveBeenCalledWith('guid')
  })

  it('shows IDER and hides KVM for ISM systems', () => {
    routeParams$.next({ id: 'guid' })
    fixture.detectChanges()

    const components = component.categories().map((c) => c.component)
    expect(components).toContain('ider')
    expect(components).not.toContain('kvm')
  })

  it('shows KVM and hides IDER for non-ISM systems', () => {
    devicesServiceSpy.getAMTVersion.and.returnValue(of(makeAmtVersion('99999') as any))
    routeParams$.next({ id: 'guid' })
    fixture.detectChanges()

    const components = component.categories().map((c) => c.component)
    expect(components).toContain('kvm')
    expect(components).not.toContain('ider')
  })

  it('sets currentView from route component param', () => {
    routeParams$.next({ id: 'guid', component: 'ider' })
    fixture.detectChanges()

    expect(component.currentView).toBe('ider')
  })

  it('includes enterprise-only categories only when not cloud mode', () => {
    routeParams$.next({ id: 'guid' })
    fixture.detectChanges()

    const components = component.categories().map((c) => c.component)
    if (component.isCloudMode) {
      expect(components).not.toContain('explorer')
      expect(components).not.toContain('network-settings')
      expect(components).not.toContain('tls')
    } else {
      expect(components).toContain('explorer')
      expect(components).toContain('network-settings')
      expect(components).toContain('tls')
    }
  })
})
