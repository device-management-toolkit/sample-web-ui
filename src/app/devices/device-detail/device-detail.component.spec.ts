/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { ReplaySubject, of, throwError } from 'rxjs'
import { DevicesService } from '../devices.service'
import { DeviceDetailComponent } from './device-detail.component'
import { provideNativeDateAdapter } from '@angular/material/core'
import { Component, signal, input } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { DeviceToolbarComponent } from '../device-toolbar/device-toolbar.component'
import { GeneralComponent } from '../general/general.component'
import { IderComponent } from '../ider/ider.component'
import { KvmComponent } from '../kvm/kvm.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let router: Router
  let snackBar: MatSnackBar
  let routeParams$: ReplaySubject<any>
  let devicesServiceSpy: jasmine.SpyObj<DevicesService>

  const makeAmtVersion = (sku: string) => ({
    CIM_SoftwareIdentity: {
      responses: [{ InstanceID: 'Sku', VersionString: sku }]
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
    public readonly isISM = input(false)
  }

  @Component({
    selector: 'app-ider',
    imports: []
  })
  class TestIderComponent {
    public readonly deviceId = input('')
    public readonly isISM = input(false)
  }

  @Component({
    selector: 'app-kvm',
    imports: []
  })
  class TestKvmComponent {
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
          IderComponent,
          KvmComponent
        ] },
      add: { imports: [
          TestDeviceToolbarComponent,
          TestGeneralComponent,
          TestIderComponent,
          TestKvmComponent
        ] }
    })

    fixture = TestBed.createComponent(DeviceDetailComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
    snackBar = TestBed.inject(MatSnackBar)
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

  it('fails closed to general and hides KVM when AMT version cannot be retrieved', () => {
    devicesServiceSpy.getAMTVersion.and.returnValue(of(null as any))
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true)

    routeParams$.next({ id: 'guid', component: 'kvm' })
    fixture.detectChanges()

    expect(component.isDeviceTypeKnown()).toBeFalse()
    expect(component.currentView).toBe('general')
    expect(navigateSpy).toHaveBeenCalledWith(
      [
        '/devices',
        'guid',
        'general'
      ],
      { replaceUrl: true }
    )

    const components = component.categories().map((c) => c.component)
    expect(components).not.toContain('kvm')
  })

  it('navigates from kvm to ider with replaceUrl for same-device ISM updates', () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true)

    routeParams$.next({ id: 'guid', component: 'general' })
    fixture.detectChanges()

    routeParams$.next({ id: 'guid', component: 'kvm' })

    expect(component.currentView).toBe('ider')
    expect(navigateSpy).toHaveBeenCalledWith(
      [
        '/devices',
        'guid',
        'ider'
      ],
      { replaceUrl: true }
    )
  })

  it('navigates from ider to kvm with replaceUrl for same-device non-ISM updates', () => {
    devicesServiceSpy.getAMTVersion.and.returnValue(of(makeAmtVersion('99999') as any))
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true)

    routeParams$.next({ id: 'guid', component: 'general' })
    fixture.detectChanges()

    routeParams$.next({ id: 'guid', component: 'ider' })

    expect(component.currentView).toBe('kvm')
    expect(navigateSpy).toHaveBeenCalledWith(
      [
        '/devices',
        'guid',
        'kvm'
      ],
      { replaceUrl: true }
    )
  })

  it('does not navigate when the current route is already valid for the resolved SKU', () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true)

    routeParams$.next({ id: 'guid', component: 'ider' })
    fixture.detectChanges()

    routeParams$.next({ id: 'guid', component: 'ider' })

    expect(component.currentView).toBe('ider')
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('fails closed and shows AMT version error snackbar when getAMTVersion throws', () => {
    devicesServiceSpy.getAMTVersion.and.returnValue(throwError(() => new Error('amt version failed')))
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true)
    spyOn(snackBar, 'open')

    routeParams$.next({ id: 'guid', component: 'kvm' })
    fixture.detectChanges()

    expect(component.isDeviceTypeKnown()).toBeFalse()
    expect(component.currentView).toBe('general')
    expect(navigateSpy).toHaveBeenCalledWith(
      [
        '/devices',
        'guid',
        'general'
      ],
      { replaceUrl: true }
    )
  })

  it('shows unknown-device-type warning only when loading is complete and device type is unknown', () => {
    devicesServiceSpy.getAMTVersion.and.returnValue(of(null as any))

    routeParams$.next({ id: 'guid', component: 'general' })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('general.errorAMTVersion.value')

    component.isLoading.set(true)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('general.errorAMTVersion.value')

    component.isLoading.set(false)
    component.isDeviceTypeKnown.set(true)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain('general.errorAMTVersion.value')
  })

  it('includes enterprise-only categories only when not cloud mode', () => {
    routeParams$.next({ id: 'guid' })
    fixture.detectChanges()

    const components = component.categories().map((c) => c.component)
    if (component.isCloudMode) {
      expect(components).not.toContain('explorer')
      expect(components).not.toContain('tls')
    } else {
      expect(components).toContain('explorer')
      expect(components).toContain('network-settings')
      expect(components).toContain('tls')
    }
  })
})
