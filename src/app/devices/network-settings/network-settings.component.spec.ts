/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { createSpyObj, type SpyObj } from '../../../test-helpers'
import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NetworkSettingsComponent } from './network-settings.component'
import { WifiDisabledAlertComponent } from '../../shared/wifi-disabled-alert/wifi-disabled-alert.component'
import { NetworkChangeAlertComponent } from '../../shared/network-change-alert/network-change-alert.component'
import { DevicesService } from '../devices.service'
import { config, of, throwError } from 'rxjs'
import { provideTranslateService } from '@ngx-translate/core'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http'

describe('NetworkSettingsComponent', () => {
  let component: NetworkSettingsComponent
  let fixture: ComponentFixture<NetworkSettingsComponent>
  let devicesServiceSpy: SpyObj<DevicesService>
  let dialogOpenSpy: MockInstance
  let snackBarOpenSpy: MockInstance

  beforeEach(async () => {
    devicesServiceSpy = createSpyObj('DevicesService', [
      'getNetworkSettings',
      'getWirelessState',
      'getWirelessProfileSync',
      'patchWiredNetworkSettings',
      'requestWirelessStateChange',
      'setWirelessProfileSync',
      'getWirelessProfiles',
      'addWirelessProfile',
      'updateWirelessProfile',
      'deleteWirelessProfile'
    ])
    devicesServiceSpy.getNetworkSettings.mockReturnValue(
      of({
        wired: { ieee8021x: {} },
        wireless: {
          wifiNetworks: [],
          ieee8021xSettings: []
        }
      } as any)
    )
    devicesServiceSpy.getWirelessState.mockReturnValue(of({ state: 'WifiEnabledS0SxAC' } as any))
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: true } as any)
    )
    devicesServiceSpy.patchWiredNetworkSettings.mockReturnValue(of(void 0))
    devicesServiceSpy.requestWirelessStateChange.mockReturnValue(of({ state: 'WifiEnabledS0SxAC' } as any))
    devicesServiceSpy.setWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: true } as any)
    )
    devicesServiceSpy.getWirelessProfiles.mockReturnValue(of([]))
    devicesServiceSpy.addWirelessProfile.mockReturnValue(of(void 0))
    devicesServiceSpy.updateWirelessProfile.mockReturnValue(of(void 0))
    devicesServiceSpy.deleteWirelessProfile.mockReturnValue(of(void 0))
    TestBed.configureTestingModule({
      imports: [NetworkSettingsComponent],
      providers: [
        provideTranslateService(),
        { provide: DevicesService, useValue: devicesServiceSpy }
      ]
    })

    fixture = TestBed.createComponent(NetworkSettingsComponent)
    component = fixture.componentInstance
    snackBarOpenSpy = vi
      .spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open')
      .mockImplementation((() => undefined) as any)
    dialogOpenSpy = vi.spyOn(fixture.debugElement.injector.get(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of(true)
    } as MatDialogRef<unknown>)
    fixture.detectChanges()
  })

  const rebuildComponent = (): void => {
    fixture = TestBed.createComponent(NetworkSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  // Several component flows intentionally re-throw via catchError without a subscriber
  // error handler, so RxJS reports the error on a macrotask. This zoneless suite cannot
  // use fakeAsync, so the action runs with RxJS's unhandled-error handler suppressed and
  // a macrotask is awaited to let the re-thrown error drain without failing other specs.
  const runAndSwallowRethrow = async (action: () => void): Promise<void> => {
    const previous = config.onUnhandledError
    config.onUnhandledError = () => undefined
    try {
      action()
      await new Promise<void>((resolve) => setTimeout(resolve))
    } finally {
      config.onUnhandledError = previous
    }
  }

  const createFileEvent = (name: string, content: string): Event => {
    const file = new File([content], name)
    const input = document.createElement('input')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    return { target: input } as unknown as Event
  }

  const waitForCredential = (
    control: 'ieee8021xClientCert' | 'ieee8021xPrivateKey' | 'ieee8021xCACert',
    trigger: () => void
  ): Promise<void> =>
    new Promise((resolve) => {
      const sub = component.wirelessProfileForm.controls[control].valueChanges.subscribe(() => {
        sub.unsubscribe()
        resolve()
      })
      trigger()
    })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('suppresses the error snackbar on a 409 conflict (handled by the global interceptor dialog)', () => {
    snackBarOpenSpy.mockClear()
    ;(component as unknown as { showError: (m: string, e?: unknown) => void }).showError(
      'msg',
      new HttpErrorResponse({ status: 409 })
    )
    expect(snackBarOpenSpy).not.toHaveBeenCalled()
  })

  it('suppresses the error snackbar on a 412 conflict (handled by the global interceptor dialog)', () => {
    snackBarOpenSpy.mockClear()
    ;(component as unknown as { showError: (m: string, e?: unknown) => void }).showError(
      'msg',
      new HttpErrorResponse({ status: 412 })
    )
    expect(snackBarOpenSpy).not.toHaveBeenCalled()
  })

  it('shows the error snackbar for non-conflict HTTP failures', () => {
    snackBarOpenSpy.mockClear()
    ;(component as unknown as { showError: (m: string, e?: unknown) => void }).showError(
      'msg',
      new HttpErrorResponse({ status: 500 })
    )
    expect(snackBarOpenSpy).toHaveBeenCalled()
  })

  it('shows the error snackbar when no error is provided', () => {
    snackBarOpenSpy.mockClear()
    ;(component as unknown as { showError: (m: string, e?: unknown) => void }).showError('msg')
    expect(snackBarOpenSpy).toHaveBeenCalled()
  })

  it('enables the UEFI profile sync toggle when the device reports support', () => {
    expect(component.uefiProfileSyncSupported()).toBe(true)
    expect(component.wirelessSettingsForm.controls.uefiProfileSyncEnabled.enabled).toBe(true)
  })

  it('disables and forces off the UEFI profile sync toggle when unsupported', () => {
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: true, uefiProfileSync: true, uefiProfileSyncSupported: false } as any)
    )

    fixture = TestBed.createComponent(NetworkSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    expect(component.uefiProfileSyncSupported()).toBe(false)
    expect(component.wirelessSettingsForm.controls.uefiProfileSyncEnabled.disabled).toBe(true)
    expect(component.wirelessSettingsForm.controls.uefiProfileSyncEnabled.value).toBe(false)
  })

  it('keeps the UEFI toggle disabled after saving when still unsupported', () => {
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: false } as any)
    )
    devicesServiceSpy.setWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: false } as any)
    )

    fixture = TestBed.createComponent(NetworkSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    component.saveWirelessSettings()

    expect(component.uefiProfileSyncSupported()).toBe(false)
    expect(component.wirelessSettingsForm.controls.uefiProfileSyncEnabled.disabled).toBe(true)
    expect(component.wirelessSettingsForm.controls.uefiProfileSyncEnabled.value).toBe(false)
  })

  it('reports wired 802.1x as disabled when no enabled value is present', () => {
    component.networkResults.set({ wired: { ieee8021x: {} } } as any)
    expect(component.isWiredIeee8021xEnabled()).toBe(false)
  })

  it('reports wired 802.1x as disabled for an empty string or "Disabled"', () => {
    component.networkResults.set({ wired: { ieee8021x: { enabled: '' } } } as any)
    expect(component.isWiredIeee8021xEnabled()).toBe(false)

    component.networkResults.set({ wired: { ieee8021x: { enabled: 'Disabled' } } } as any)
    expect(component.isWiredIeee8021xEnabled()).toBe(false)
  })

  it('reports wired 802.1x as enabled for a non-disabled value', () => {
    component.networkResults.set({ wired: { ieee8021x: { enabled: 'EnabledWithCertificates' } } } as any)
    expect(component.isWiredIeee8021xEnabled()).toBe(true)
  })

  it('toggles the wired 802.1x expanded state', () => {
    expect(component.wiredIeee8021xExpanded()).toBe(false)

    component.toggleWiredIeee8021x()
    expect(component.wiredIeee8021xExpanded()).toBe(true)

    component.toggleWiredIeee8021x()
    expect(component.wiredIeee8021xExpanded()).toBe(false)
  })

  it('toggles the wired configuration form visibility', () => {
    expect(component.showWiredConfigForm()).toBe(false)

    component.toggleWiredConfigForm()
    expect(component.showWiredConfigForm()).toBe(true)

    component.toggleWiredConfigForm()
    expect(component.showWiredConfigForm()).toBe(false)
  })

  it('toggles the wireless configuration form visibility', () => {
    expect(component.showWirelessConfigForm()).toBe(false)

    component.toggleWirelessConfigForm()
    expect(component.showWirelessConfigForm()).toBe(true)

    component.toggleWirelessConfigForm()
    expect(component.showWirelessConfigForm()).toBe(false)
  })

  it('reverts and hides the wired settings form when cancelling', () => {
    component.networkResults.set({ wired: { dhcpEnabled: true, ipSyncEnabled: true } } as any)
    component.showWiredConfigForm.set(true)
    component.wiredForm.controls.dhcpEnabled.setValue(false)
    component.wiredForm.markAsDirty()

    component.cancelWiredSettings()

    expect(component.wiredForm.controls.dhcpEnabled.value).toBe(true)
    expect(component.wiredForm.pristine).toBe(true)
    expect(component.showWiredConfigForm()).toBe(false)
  })

  it('reverts and hides the wireless settings form when cancelling', () => {
    component.wirelessStatus.set({ enabled: true, localProfileSyncEnabled: false, uefiProfileSyncEnabled: false })
    component.showWirelessConfigForm.set(true)
    component.wirelessSettingsForm.controls.enabled.setValue(false)
    component.wirelessSettingsForm.markAsDirty()

    component.cancelWirelessSettings()

    expect(component.wirelessSettingsForm.controls.enabled.value).toBe(true)
    expect(component.wirelessSettingsForm.pristine).toBe(true)
    expect(component.showWirelessConfigForm()).toBe(false)
  })

  it('closes the add profile form without a dialog when toggled shut', () => {
    component.wirelessStatus.set({ enabled: false, localProfileSyncEnabled: false, uefiProfileSyncEnabled: false })
    component.showWirelessProfileForm.set(true)
    component.editingWirelessProfileName.set(null)
    dialogOpenSpy.mockClear()

    component.toggleWirelessProfileForm()

    expect(dialogOpenSpy).not.toHaveBeenCalled()
    expect(component.showWirelessProfileForm()).toBe(false)
  })

  it('opens the add profile form through the WiFi-disabled warning when toggled open', () => {
    component.wirelessStatus.set({ enabled: false, localProfileSyncEnabled: false, uefiProfileSyncEnabled: false })
    component.showWirelessProfileForm.set(false)

    component.toggleWirelessProfileForm()

    expect(dialogOpenSpy).toHaveBeenCalledWith(WifiDisabledAlertComponent)
    expect(component.showWirelessProfileForm()).toBe(true)
  })

  it('reloads the read-only network details after saving wireless settings', () => {
    devicesServiceSpy.getNetworkSettings.mockClear()

    component.saveWirelessSettings()

    expect(devicesServiceSpy.getNetworkSettings).toHaveBeenCalledTimes(1)
    expect(component.isRefreshingNetwork()).toBe(false)
  })

  it('refreshes the wireless profile list after saving a profile', () => {
    component.wirelessProfileForm.patchValue({
      profileName: 'profile1',
      ssid: 'ssid1',
      priority: 1,
      authenticationMethod: 'WPA2PSK',
      encryptionMethod: 'CCMP',
      password: 'password1'
    })
    devicesServiceSpy.getWirelessProfiles.mockClear()
    devicesServiceSpy.getWirelessProfiles.mockReturnValue(
      of([{ profileName: 'profile1', ssid: 'ssid1', priority: 1 }] as any)
    )

    component.saveWirelessProfile()

    expect(devicesServiceSpy.getWirelessProfiles).toHaveBeenCalledTimes(1)
    expect(component.wirelessProfiles().length).toBe(1)
    expect(component.isLoadingWirelessProfiles()).toBe(false)
  })

  it('does not flag the wireless profile limit when fewer than the maximum exist', () => {
    component.wirelessProfiles.set(
      Array.from({ length: component.maxWirelessProfiles - 1 }, (_, i) => ({
        profileName: `profile${i}`,
        ssid: `ssid${i}`,
        priority: i + 1
      })) as any
    )

    expect(component.isWirelessProfileLimitReached()).toBe(false)
  })

  it('flags the wireless profile limit once the maximum number of profiles exist', () => {
    component.wirelessProfiles.set(
      Array.from({ length: component.maxWirelessProfiles }, (_, i) => ({
        profileName: `profile${i}`,
        ssid: `ssid${i}`,
        priority: i + 1
      })) as any
    )

    expect(component.isWirelessProfileLimitReached()).toBe(true)
  })

  it('disables the add wireless profile button when the maximum number of profiles is reached', () => {
    component.selectedTabIndex.set(1)
    component.wirelessProfiles.set(
      Array.from({ length: component.maxWirelessProfiles }, (_, i) => ({
        profileName: `profile${i}`,
        ssid: `ssid${i}`,
        priority: i + 1
      })) as any
    )
    fixture.detectChanges()

    const addButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('.profile-add-button')
    expect(addButton).not.toBeNull()
    expect(addButton?.disabled).toBe(true)
  })

  it('starts a new wireless profile with an empty priority', () => {
    component.addNewWirelessProfile()

    expect(component.wirelessProfileForm.controls.priority.value).toBeNull()
    expect(component.wirelessProfileForm.controls.priority.hasError('required')).toBe(true)
  })

  it('warns with a dialog but still opens the form when adding a profile while WiFi is disabled', () => {
    component.wirelessStatus.set({ enabled: false, localProfileSyncEnabled: false, uefiProfileSyncEnabled: false })

    component.addNewWirelessProfile()

    expect(dialogOpenSpy).toHaveBeenCalledWith(WifiDisabledAlertComponent)
    expect(component.showWirelessProfileForm()).toBe(true)
  })

  it('does not open the WiFi disabled dialog when adding a profile while WiFi is enabled', () => {
    component.wirelessStatus.set({ enabled: true, localProfileSyncEnabled: false, uefiProfileSyncEnabled: false })
    dialogOpenSpy.mockClear()

    component.addNewWirelessProfile()

    expect(dialogOpenSpy).not.toHaveBeenCalledWith(WifiDisabledAlertComponent)
    expect(component.showWirelessProfileForm()).toBe(true)
  })

  it('flags a priority already used by another wireless profile', () => {
    component.wirelessProfiles.set([{ profileName: 'profile1', ssid: 'ssid1', priority: 2 }] as any)
    component.addNewWirelessProfile()

    component.wirelessProfileForm.controls.priority.setValue(2)

    expect(component.wirelessProfileForm.controls.priority.hasError('priorityConflict')).toBe(true)
  })

  it('accepts a priority that is not used by any other wireless profile', () => {
    component.wirelessProfiles.set([{ profileName: 'profile1', ssid: 'ssid1', priority: 2 }] as any)
    component.addNewWirelessProfile()

    component.wirelessProfileForm.controls.priority.setValue(3)

    expect(component.wirelessProfileForm.controls.priority.hasError('priorityConflict')).toBe(false)
  })

  it('does not flag the edited profile against its own priority', () => {
    const profile = { profileName: 'profile1', ssid: 'ssid1', priority: 2 } as any
    component.wirelessProfiles.set([profile])

    component.editWirelessProfile(profile)

    expect(component.wirelessProfileForm.controls.priority.value).toBe(2)
    expect(component.wirelessProfileForm.controls.priority.hasError('priorityConflict')).toBe(false)
  })

  it('blocks non-numeric keys on the priority field', () => {
    for (const key of [
      'e',
      'E',
      '+',
      '-',
      '.'
    ]) {
      const event = new KeyboardEvent('keydown', { key })
      vi.spyOn(event, 'preventDefault').mockImplementation(() => undefined)

      component.blockNonNumericKey(event)

      expect(event.preventDefault).toHaveBeenCalled()
    }
  })

  it('allows numeric keys on the priority field', () => {
    const event = new KeyboardEvent('keydown', { key: '5' })
    vi.spyOn(event, 'preventDefault').mockImplementation(() => undefined)

    component.blockNonNumericKey(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('shows an error and clears the loading flags when the network settings request fails', async () => {
    devicesServiceSpy.getNetworkSettings.mockReturnValue(throwError(() => new Error('boom')))
    snackBarOpenSpy.mockClear()

    await runAndSwallowRethrow(() => rebuildComponent())

    expect(snackBarOpenSpy).toHaveBeenCalled()
    expect(component.isWiredLoading()).toBe(false)
    expect(component.isWirelessLoading()).toBe(false)
    expect(component.isWirelessConfigLoading()).toBe(false)
  })

  it('selects the wireless tab when the device has no wired adapter', () => {
    devicesServiceSpy.getNetworkSettings.mockReturnValue(
      of({ wired: null, wireless: { wifiNetworks: [], ieee8021xSettings: [] } } as any)
    )

    rebuildComponent()

    expect(component.selectedTabIndex()).toBe(1)
  })

  it('stops the wireless config spinner when the device has no wireless adapter', () => {
    devicesServiceSpy.getNetworkSettings.mockReturnValue(of({ wired: { ieee8021x: {} }, wireless: null } as any))

    rebuildComponent()

    expect(component.isWirelessConfigLoading()).toBe(false)
  })

  it('reports adapters as present while the settings are still loading', () => {
    component.isWiredLoading.set(true)
    component.isWirelessLoading.set(true)
    component.networkResults.set({ wired: null, wireless: null } as any)

    expect(component.hasWiredAdapter()).toBe(true)
    expect(component.hasWirelessAdapter()).toBe(true)
  })

  it('reports adapter availability from the loaded settings once loading completes', () => {
    component.isWiredLoading.set(false)
    component.isWirelessLoading.set(false)

    component.networkResults.set({ wired: { ieee8021x: {} }, wireless: {} } as any)
    expect(component.hasWiredAdapter()).toBe(true)
    expect(component.hasWirelessAdapter()).toBe(true)

    component.networkResults.set({ wired: null, wireless: null } as any)
    expect(component.hasWiredAdapter()).toBe(false)
    expect(component.hasWirelessAdapter()).toBe(false)
  })

  it('does not call the backend when the wired form is invalid', () => {
    devicesServiceSpy.patchWiredNetworkSettings.mockClear()
    component.wiredForm.controls.dhcpEnabled.setValue(false)
    component.wiredForm.controls.ipSyncEnabled.setValue(false)
    component.wiredForm.controls.ipAddress.setValue('')

    component.saveWiredSettings()

    expect(devicesServiceSpy.patchWiredNetworkSettings).not.toHaveBeenCalled()
    expect(component.wiredForm.touched).toBe(true)
  })

  it('confirms before saving wired settings and aborts when the dialog is dismissed', () => {
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(false) } as MatDialogRef<unknown>)
    devicesServiceSpy.patchWiredNetworkSettings.mockClear()
    component.wiredForm.controls.dhcpEnabled.setValue(true)

    component.saveWiredSettings()

    expect(dialogOpenSpy).toHaveBeenCalledWith(NetworkChangeAlertComponent, expect.any(Object))
    expect(devicesServiceSpy.patchWiredNetworkSettings).not.toHaveBeenCalled()
  })

  it('warns about a possible connection drop before saving wired settings', () => {
    component.wiredForm.controls.dhcpEnabled.setValue(true)

    component.saveWiredSettings()

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      NetworkChangeAlertComponent,
      expect.objectContaining({ data: { messageKey: 'network.changeAlert.message.value' } })
    )
  })

  it('saves wired settings with a DHCP payload and refreshes the read-only details', () => {
    devicesServiceSpy.getNetworkSettings.mockClear()
    component.wiredForm.controls.dhcpEnabled.setValue(true)

    component.saveWiredSettings()

    expect(devicesServiceSpy.patchWiredNetworkSettings).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ dhcpEnabled: true, ipSyncEnabled: true })
    )
    expect(component.isSavingWired()).toBe(false)
    expect(devicesServiceSpy.getNetworkSettings).toHaveBeenCalledTimes(1)
  })

  it('includes the static IP fields when DHCP and IP sync are both disabled', () => {
    component.wiredForm.controls.dhcpEnabled.setValue(false)
    component.wiredForm.controls.ipSyncEnabled.setValue(false)
    component.wiredForm.patchValue({
      ipAddress: '192.168.1.10',
      subnetMask: '255.255.255.0',
      defaultGateway: '192.168.1.1',
      primaryDNS: '8.8.8.8',
      secondaryDNS: '8.8.4.4'
    })

    component.saveWiredSettings()

    expect(devicesServiceSpy.patchWiredNetworkSettings).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        dhcpEnabled: false,
        ipSyncEnabled: false,
        ipAddress: '192.168.1.10',
        subnetMask: '255.255.255.0',
        defaultGateway: '192.168.1.1',
        primaryDNS: '8.8.8.8',
        secondaryDNS: '8.8.4.4'
      })
    )
  })

  it('shows an error when saving wired settings fails', async () => {
    devicesServiceSpy.patchWiredNetworkSettings.mockReturnValue(throwError(() => new Error('fail')))
    snackBarOpenSpy.mockClear()
    component.wiredForm.controls.dhcpEnabled.setValue(true)

    await runAndSwallowRethrow(() => component.saveWiredSettings())

    expect(snackBarOpenSpy).toHaveBeenCalled()
    expect(component.isSavingWired()).toBe(false)
  })

  it('ignores a null result when refreshing the read-only network details', () => {
    component.wiredForm.controls.dhcpEnabled.setValue(true)
    const previous = component.networkResults()
    devicesServiceSpy.getNetworkSettings.mockReturnValue(of(null as any))

    component.saveWiredSettings()

    expect(component.isRefreshingNetwork()).toBe(false)
    expect(component.networkResults()).toBe(previous)
  })

  it('recovers when refreshing the read-only network details fails', () => {
    component.wiredForm.controls.dhcpEnabled.setValue(true)
    devicesServiceSpy.getNetworkSettings.mockReturnValue(throwError(() => new Error('fail')))

    component.saveWiredSettings()

    expect(component.isRefreshingNetwork()).toBe(false)
  })

  it('disables IP sync when the loaded wired settings use DHCP', () => {
    devicesServiceSpy.getNetworkSettings.mockReturnValue(
      of({ wired: { dhcpEnabled: true, ieee8021x: {} }, wireless: null } as any)
    )

    rebuildComponent()

    expect(component.wiredForm.controls.dhcpEnabled.value).toBe(true)
    expect(component.wiredForm.controls.ipSyncEnabled.disabled).toBe(true)
  })

  it('reloads the wireless configuration when saving wireless settings fails', async () => {
    devicesServiceSpy.requestWirelessStateChange.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.getWirelessState.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.setWirelessProfileSync.mockClear()
    devicesServiceSpy.getWirelessState.mockClear()
    snackBarOpenSpy.mockClear()

    await runAndSwallowRethrow(() => component.saveWirelessSettings())

    expect(devicesServiceSpy.setWirelessProfileSync).not.toHaveBeenCalled()
    expect(devicesServiceSpy.getWirelessState).toHaveBeenCalled()
    expect(component.isSavingWireless()).toBe(false)
    expect(component.wirelessSettingsForm.enabled).toBe(true)
  })

  it('confirms before saving wireless settings and aborts when the dialog is dismissed', () => {
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(false) } as MatDialogRef<unknown>)
    devicesServiceSpy.requestWirelessStateChange.mockClear()

    component.saveWirelessSettings()

    expect(dialogOpenSpy).toHaveBeenCalledWith(NetworkChangeAlertComponent, expect.any(Object))
    expect(devicesServiceSpy.requestWirelessStateChange).not.toHaveBeenCalled()
  })

  it('shows the general warning when saving wireless settings without disabling WiFi', () => {
    component.wirelessSettingsForm.controls.enabled.setValue(true)

    component.saveWirelessSettings()

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      NetworkChangeAlertComponent,
      expect.objectContaining({ data: { messageKey: 'network.changeAlert.message.value' } })
    )
  })

  it('warns to use the wired adapter when disabling WiFi on a device that has one', () => {
    component.wirelessSettingsForm.controls.enabled.setValue(false)

    component.saveWirelessSettings()

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      NetworkChangeAlertComponent,
      expect.objectContaining({ data: { messageKey: 'network.changeAlert.wifiDisableWithWired.value' } })
    )
  })

  it('warns there is no way to reconnect when disabling WiFi on a device with no wired adapter', () => {
    component.isWiredLoading.set(false)
    component.networkResults.set({ wired: null, wireless: {} } as any)
    component.wirelessSettingsForm.controls.enabled.setValue(false)

    component.saveWirelessSettings()

    expect(dialogOpenSpy).toHaveBeenCalledWith(
      NetworkChangeAlertComponent,
      expect.objectContaining({ data: { messageKey: 'network.changeAlert.wifiDisableNoWired.value' } })
    )
  })

  it('sends a WifiDisabled state when wireless is turned off', () => {
    component.wirelessSettingsForm.controls.enabled.setValue(false)
    devicesServiceSpy.requestWirelessStateChange.mockClear()
    devicesServiceSpy.requestWirelessStateChange.mockReturnValue(of({ state: 'WifiDisabled' } as any))

    component.saveWirelessSettings()

    expect(devicesServiceSpy.requestWirelessStateChange).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ state: 'WifiDisabled' })
    )
  })

  it('captures the device wireless status into the read-only snapshot on load', () => {
    expect(component.wirelessStatus()).toEqual({
      enabled: true,
      localProfileSyncEnabled: true,
      uefiProfileSyncEnabled: false
    })
  })

  it('does not change the read-only status snapshot while editing the wireless form', () => {
    const before = component.wirelessStatus()

    component.wirelessSettingsForm.controls.enabled.setValue(false)
    component.wirelessSettingsForm.controls.localProfileSyncEnabled.setValue(false)
    component.wirelessSettingsForm.controls.uefiProfileSyncEnabled.setValue(true)

    expect(component.wirelessStatus()).toEqual(before)
  })

  it('updates the read-only status snapshot after a successful save', () => {
    devicesServiceSpy.requestWirelessStateChange.mockReturnValue(of({ state: 'WifiDisabled' } as any))
    devicesServiceSpy.setWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: false, uefiProfileSync: true, uefiProfileSyncSupported: true } as any)
    )

    component.saveWirelessSettings()

    expect(component.wirelessStatus()).toEqual({
      enabled: false,
      localProfileSyncEnabled: false,
      uefiProfileSyncEnabled: true
    })
  })

  it('leaves the read-only status snapshot undefined when the device status fails to load', () => {
    devicesServiceSpy.getWirelessState.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(throwError(() => new Error('fail')))

    rebuildComponent()

    expect(component.wirelessStatus()).toEqual({
      enabled: false,
      localProfileSyncEnabled: false,
      uefiProfileSyncEnabled: false
    })
  })

  it('falls back to the current wireless settings when the wireless card data fails to load', () => {
    devicesServiceSpy.getWirelessState.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.getWirelessProfiles.mockReturnValue(throwError(() => new Error('fail')))

    rebuildComponent()

    expect(component.isWirelessConfigLoading()).toBe(false)
    expect(component.wirelessProfiles()).toEqual([])
    expect(component.uefiProfileSyncSupported()).toBe(true)
  })

  it('repopulates the wireless toggles from the reloaded configuration after a failed save', async () => {
    devicesServiceSpy.requestWirelessStateChange.mockReturnValue(throwError(() => new Error('fail')))
    devicesServiceSpy.getWirelessState.mockReturnValue(of({ state: 'WifiEnabledS0SxAC' } as any))
    devicesServiceSpy.getWirelessProfileSync.mockReturnValue(
      of({ localProfileSync: true, uefiProfileSync: false, uefiProfileSyncSupported: true } as any)
    )

    await runAndSwallowRethrow(() => component.saveWirelessSettings())

    expect(component.wirelessSettingsForm.controls.enabled.value).toBe(true)
  })

  it('sorts wireless profiles by ascending priority', () => {
    devicesServiceSpy.getWirelessProfiles.mockReturnValue(
      of([
        { profileName: 'b', ssid: 'b', priority: 3 },
        { profileName: 'a', ssid: 'a', priority: 1 }
      ] as any)
    )

    rebuildComponent()

    expect(component.wirelessProfiles().map((p) => p.profileName)).toEqual(['a', 'b'])
  })

  it('does not save a wireless profile when the form is invalid', () => {
    devicesServiceSpy.addWirelessProfile.mockClear()
    component.resetWirelessProfileForm()

    component.saveWirelessProfile()

    expect(devicesServiceSpy.addWirelessProfile).not.toHaveBeenCalled()
  })

  it('builds an 802.1x TLS payload when adding a certificate-based wireless profile', () => {
    component.addNewWirelessProfile()
    component.wirelessProfileForm.patchValue({
      profileName: 'corpprofile',
      ssid: 'corp',
      priority: 1,
      authenticationMethod: 'WPA2IEEE8021x',
      encryptionMethod: 'CCMP',
      ieee8021xUsername: 'user1',
      ieee8021xAuthenticationProtocol: 0,
      ieee8021xClientCert: 'CLIENTCERT',
      ieee8021xPrivateKey: 'PRIVATEKEY',
      ieee8021xCACert: 'CACERT'
    })

    component.saveWirelessProfile()

    expect(devicesServiceSpy.addWirelessProfile).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        profileName: 'corpprofile',
        ieee8021x: expect.objectContaining({
          username: 'user1',
          authenticationProtocol: 0,
          clientCert: 'CLIENTCERT',
          privateKey: 'PRIVATEKEY',
          caCert: 'CACERT'
        })
      })
    )
  })

  it('builds an 802.1x PEAP payload and updates an existing profile', () => {
    component.editingWirelessProfileName.set('corpprofile')
    component.showWirelessProfileForm.set(true)
    component.wirelessProfileForm.controls.profileName.disable()
    component.wirelessProfileForm.patchValue({
      profileName: 'corpprofile',
      ssid: 'corp',
      priority: 1,
      authenticationMethod: 'WPA2IEEE8021x',
      encryptionMethod: 'CCMP',
      ieee8021xUsername: 'user1',
      ieee8021xAuthenticationProtocol: 2,
      ieee8021xPassword: 'secret'
    })

    component.saveWirelessProfile()

    expect(devicesServiceSpy.updateWirelessProfile).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ieee8021x: expect.objectContaining({ authenticationProtocol: 2, password: 'secret' })
      })
    )
  })

  it('shows an error when saving a wireless profile fails', async () => {
    devicesServiceSpy.addWirelessProfile.mockReturnValue(throwError(() => new Error('fail')))
    snackBarOpenSpy.mockClear()
    component.addNewWirelessProfile()
    component.wirelessProfileForm.patchValue({
      profileName: 'p1',
      ssid: 's1',
      priority: 1,
      authenticationMethod: 'WPA2PSK',
      encryptionMethod: 'CCMP',
      password: 'password1'
    })

    await runAndSwallowRethrow(() => component.saveWirelessProfile())

    expect(snackBarOpenSpy).toHaveBeenCalled()
    expect(component.isSavingWirelessProfile()).toBe(false)
  })

  it('falls back to an empty wireless profile list when reloading after a save fails', () => {
    devicesServiceSpy.getWirelessProfiles.mockReturnValue(throwError(() => new Error('fail')))
    component.addNewWirelessProfile()
    component.wirelessProfileForm.patchValue({
      profileName: 'p1',
      ssid: 's1',
      priority: 1,
      authenticationMethod: 'WPA2PSK',
      encryptionMethod: 'CCMP',
      password: 'password1'
    })

    component.saveWirelessProfile()

    expect(component.wirelessProfiles()).toEqual([])
    expect(component.isLoadingWirelessProfiles()).toBe(false)
  })

  it('populates the 802.1x fields when editing a certificate-based profile', () => {
    const profile = {
      profileName: 'corp',
      ssid: 'corp',
      priority: 3,
      authenticationMethod: 'WPA2IEEE8021x',
      encryptionMethod: 'CCMP',
      ieee8021x: { username: 'user1', authenticationProtocol: 2 }
    } as any
    component.wirelessProfiles.set([profile])

    component.editWirelessProfile(profile)

    expect(component.wirelessProfileForm.controls.ieee8021xUsername.value).toBe('user1')
    expect(component.wirelessProfileForm.controls.ieee8021xAuthenticationProtocol.value).toBe(2)
    expect(component.editingWirelessProfileName()).toBe('corp')
    expect(component.wirelessProfileForm.controls.profileName.disabled).toBe(true)
  })

  it('deletes a wireless profile after confirmation and resets the form when editing it', () => {
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(true) } as MatDialogRef<unknown>)
    component.editingWirelessProfileName.set('p1')
    devicesServiceSpy.getWirelessProfiles.mockClear()
    snackBarOpenSpy.mockClear()

    component.deleteWirelessProfile('p1')

    expect(devicesServiceSpy.deleteWirelessProfile).toHaveBeenCalledWith(expect.any(String), 'p1')
    expect(snackBarOpenSpy).toHaveBeenCalled()
    expect(component.editingWirelessProfileName()).toBeNull()
    expect(component.isSavingWirelessProfile()).toBe(false)
    expect(devicesServiceSpy.getWirelessProfiles).toHaveBeenCalledTimes(1)
  })

  it('does not delete a wireless profile when the confirmation is dismissed', () => {
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(false) } as MatDialogRef<unknown>)
    devicesServiceSpy.deleteWirelessProfile.mockClear()

    component.deleteWirelessProfile('p1')

    expect(devicesServiceSpy.deleteWirelessProfile).not.toHaveBeenCalled()
  })

  it('shows an error when deleting a wireless profile fails', async () => {
    dialogOpenSpy.mockReturnValue({ afterClosed: () => of(true) } as MatDialogRef<unknown>)
    devicesServiceSpy.deleteWirelessProfile.mockReturnValue(throwError(() => new Error('fail')))
    snackBarOpenSpy.mockClear()

    await runAndSwallowRethrow(() => component.deleteWirelessProfile('p1'))

    expect(snackBarOpenSpy).toHaveBeenCalled()
    expect(component.isSavingWirelessProfile()).toBe(false)
  })

  it('reads a PEM certificate file and stores the stripped base64 body', async () => {
    const pem = '-----BEGIN CERTIFICATE-----\nABC123DEF456\n-----END CERTIFICATE-----\n'
    const event = createFileEvent('cert.pem', pem)

    await waitForCredential('ieee8021xClientCert', () => component.onClientCertSelected(event))

    expect(component.wirelessProfileForm.controls.ieee8021xClientCert.value).toBe('ABC123DEF456')
    expect(component.clientCertFileName()).toBe('cert.pem')
  })

  it('reads a binary key file and stores its base64 contents', async () => {
    const event = createFileEvent('key.der', 'binarydata')

    await waitForCredential('ieee8021xPrivateKey', () => component.onPrivateKeySelected(event))

    expect(component.wirelessProfileForm.controls.ieee8021xPrivateKey.value.length).toBeGreaterThan(0)
    expect(component.privateKeyFileName()).toBe('key.der')
  })

  it('reads a PEM CA certificate through the CA cert input', async () => {
    const pem = '-----BEGIN CERTIFICATE-----\nCACONTENT\n-----END CERTIFICATE-----'
    const event = createFileEvent('ca.crt', pem)

    await waitForCredential('ieee8021xCACert', () => component.onCACertSelected(event))

    expect(component.wirelessProfileForm.controls.ieee8021xCACert.value).toBe('CACONTENT')
    expect(component.caCertFileName()).toBe('ca.crt')
  })

  it('ignores a credential file selection when no file is provided', () => {
    const input = document.createElement('input')
    Object.defineProperty(input, 'files', { value: [], configurable: true })
    const event = { target: input } as unknown as Event

    component.onClientCertSelected(event)

    expect(component.wirelessProfileForm.controls.ieee8021xClientCert.value).toBe('')
    expect(component.clientCertFileName()).toBe('')
  })

  it('skips reading a credential file when FileReader is unavailable', () => {
    const original = (window as unknown as { FileReader: unknown }).FileReader
    ;(window as unknown as { FileReader: unknown }).FileReader = undefined
    try {
      const event = createFileEvent('cert.pem', 'data')

      component.onClientCertSelected(event)

      expect(component.clientCertFileName()).toBe('')
    } finally {
      ;(window as unknown as { FileReader: unknown }).FileReader = original
    }
  })

  it('stores the raw data URL when a binary credential file lacks a base64 marker', async () => {
    const original = (window as unknown as { FileReader: unknown }).FileReader
    class FakeFileReader {
      public onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      public result: string | null = null
      public readAsDataURL(): void {
        this.result = 'data:notbase64-content'
        this.onload?.({ target: this as unknown as FileReader } as ProgressEvent<FileReader>)
      }
      public readAsText(): void {
        this.result = ''
        this.onload?.({ target: this as unknown as FileReader } as ProgressEvent<FileReader>)
      }
    }
    ;(window as unknown as { FileReader: unknown }).FileReader = FakeFileReader
    try {
      const event = createFileEvent('key.der', 'whatever')

      await waitForCredential('ieee8021xPrivateKey', () => component.onPrivateKeySelected(event))

      expect(component.wirelessProfileForm.controls.ieee8021xPrivateKey.value).toBe('data:notbase64-content')
    } finally {
      ;(window as unknown as { FileReader: unknown }).FileReader = original
    }
  })
})
