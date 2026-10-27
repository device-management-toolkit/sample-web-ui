/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'
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
import { LayoutService } from '../../core/layout.service'

describe('DeviceDetailComponent', () => {
  let component: DeviceDetailComponent
  let fixture: ComponentFixture<DeviceDetailComponent>
  let router: Router
  let snackBar: MatSnackBar
  let routeParams$: ReplaySubject<any>
  let devicesServiceSpy: SpyObj<DevicesService>
  let layoutServiceStub: {
    isHandset: ReturnType<typeof signal<boolean>>
    opened: ReturnType<typeof signal<boolean>>
    immersive: ReturnType<typeof signal<boolean>>
    toggle: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    setImmersive: ReturnType<typeof vi.fn>
  }

  const makeAmtVersion = (sku: string) => ({
    CIM_SoftwareIdentity: {
      responses: [{ InstanceID: 'Sku', VersionString: sku }]
    }
  })

  @Component({
    template: '',
    selector: 'app-device-toolbar',
    imports: []
  })
  class TestDeviceToolbarComponent {
    readonly isLoading = input(signal(false))

    public readonly deviceId = input('')
  }
  @Component({
    template: '',
    selector: 'app-general',
    imports: []
  })
  class TestGeneralComponent {
    readonly isLoading = input(signal(false))

    public readonly deviceId = input('')
    public readonly isISM = input(false)
  }

  @Component({
    template: '',
    selector: 'app-ider',
    imports: []
  })
  class TestIderComponent {
    public readonly deviceId = input('')
    public readonly isISM = input(false)
  }

  @Component({
    template: '',
    selector: 'app-kvm',
    imports: []
  })
  class TestKvmComponent {
    public readonly deviceId = input('')
  }

  beforeEach(() => {
    routeParams$ = new ReplaySubject<any>(1)
    devicesServiceSpy = createSpyObj('DevicesService', ['getAMTVersion'])
    devicesServiceSpy.getAMTVersion.mockReturnValue(of(makeAmtVersion('16400') as any))
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
        DeviceDetailComponent,
        TestDeviceToolbarComponent
      ],
      providers: [
        provideTranslateService(),
        provideRouter([]), // Provide an empty router configuration
        provideNativeDateAdapter(),
        { provide: DevicesService, useValue: devicesServiceSpy },
        { provide: LayoutService, useValue: layoutServiceStub },
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
    devicesServiceSpy.getAMTVersion.mockReturnValue(of(makeAmtVersion('99999') as any))
    routeParams$.next({ id: 'guid' })
    fixture.detectChanges()

    const components = component.categories().map((c) => c.component)
    expect(components).toContain('kvm')
    expect(components).not.toContain('ider')
  })

  it('sets currentView from route component param', () => {
    routeParams$.next({ id: 'guid', component: 'ider' })
    fixture.detectChanges()

    expect(component.currentView()).toBe('ider')
  })

  it('fails closed to general and hides KVM when AMT version cannot be retrieved', () => {
    devicesServiceSpy.getAMTVersion.mockReturnValue(of(null as any))
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true)

    routeParams$.next({ id: 'guid', component: 'kvm' })
    fixture.detectChanges()

    expect(component.isDeviceTypeKnown()).toBe(false)
    expect(component.currentView()).toBe('general')
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
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true)

    routeParams$.next({ id: 'guid', component: 'general' })
    fixture.detectChanges()

    routeParams$.next({ id: 'guid', component: 'kvm' })

    expect(component.currentView()).toBe('ider')
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
    devicesServiceSpy.getAMTVersion.mockReturnValue(of(makeAmtVersion('99999') as any))
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true)

    routeParams$.next({ id: 'guid', component: 'general' })
    fixture.detectChanges()

    routeParams$.next({ id: 'guid', component: 'ider' })

    expect(component.currentView()).toBe('kvm')
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
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true)

    routeParams$.next({ id: 'guid', component: 'ider' })
    fixture.detectChanges()

    routeParams$.next({ id: 'guid', component: 'ider' })

    expect(component.currentView()).toBe('ider')
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('fails closed and shows AMT version error snackbar when getAMTVersion throws', () => {
    devicesServiceSpy.getAMTVersion.mockReturnValue(throwError(() => new Error('amt version failed')))
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true)
    vi.spyOn(snackBar, 'open').mockImplementation((() => undefined) as any)

    routeParams$.next({ id: 'guid', component: 'kvm' })
    fixture.detectChanges()

    expect(component.isDeviceTypeKnown()).toBe(false)
    expect(component.currentView()).toBe('general')
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
    devicesServiceSpy.getAMTVersion.mockReturnValue(of(null as any))

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

  describe('Responsive drawer', () => {
    it('uses mode="side" and stays opened when not a handset', () => {
      layoutServiceStub.isHandset.set(false)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()

      const sidenav = fixture.debugElement.query((d) => d.name === 'mat-sidenav').componentInstance
      expect(sidenav.mode).toBe('side')
      expect(sidenav.opened).toBe(true)
    })

    it('uses mode="over" and tracks the local drawerOpened signal when a handset', () => {
      layoutServiceStub.isHandset.set(true)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()

      const sidenav = fixture.debugElement.query((d) => d.name === 'mat-sidenav').componentInstance
      expect(sidenav.mode).toBe('over')
      expect(sidenav.opened).toBe(false)

      component.drawerOpened.set(true)
      fixture.detectChanges()
      expect(sidenav.opened).toBe(true)
    })

    it('closes the drawer via (closedStart) without touching the shell layout.opened()', () => {
      layoutServiceStub.isHandset.set(true)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()
      component.drawerOpened.set(true)
      fixture.detectChanges()

      const sidenav = fixture.debugElement.query((d) => d.name === 'mat-sidenav').componentInstance
      sidenav.closedStart.emit()
      expect(component.drawerOpened()).toBe(false)
      expect(layoutServiceStub.close).not.toHaveBeenCalled()
    })

    it('auto-closes the drawer when a category is selected on handset', () => {
      layoutServiceStub.isHandset.set(true)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()
      component.drawerOpened.set(true)

      component.setCurrentView({ component: 'general' })
      expect(component.drawerOpened()).toBe(false)
    })

    it('leaves the drawer open when a category is selected on desktop', () => {
      layoutServiceStub.isHandset.set(false)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()
      component.drawerOpened.set(true)

      component.setCurrentView({ component: 'general' })
      expect(component.drawerOpened()).toBe(true)
    })

    it('hides the collapse/expand toggle on handset', () => {
      layoutServiceStub.isHandset.set(true)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()

      const toggles = Array.from(fixture.nativeElement.querySelectorAll('a[mat-list-item]')).filter((a: any) =>
        a.querySelector('mat-icon')?.textContent?.includes('chevron')
      )
      expect(toggles.length).toBe(0)
    })

    it('shows the collapse/expand toggle on desktop', () => {
      layoutServiceStub.isHandset.set(false)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()

      const toggles = Array.from(fixture.nativeElement.querySelectorAll('a[mat-list-item]')).filter((a: any) =>
        a.querySelector('mat-icon')?.textContent?.includes('chevron')
      )
      expect(toggles.length).toBe(1)
    })

    it('shows the category FAB only when handset and not immersive', () => {
      layoutServiceStub.isHandset.set(false)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.category-fab')).toBeNull()

      layoutServiceStub.isHandset.set(true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.category-fab')).not.toBeNull()

      layoutServiceStub.immersive.set(true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.category-fab')).toBeNull()
    })

    it('toggles the drawer when the category FAB is clicked', () => {
      layoutServiceStub.isHandset.set(true)
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()

      const fab: HTMLButtonElement = fixture.nativeElement.querySelector('.category-fab')
      fab.click()
      expect(component.drawerOpened()).toBe(true)

      fab.click()
      expect(component.drawerOpened()).toBe(false)
    })

    it('hides app-device-toolbar while immersive', () => {
      routeParams$.next({ id: 'guid' })
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('app-device-toolbar')).not.toBeNull()

      layoutServiceStub.immersive.set(true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('app-device-toolbar')).toBeNull()
    })
  })
})
