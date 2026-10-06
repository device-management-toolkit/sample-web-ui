/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideTranslateService } from '@ngx-translate/core'
import { DiscoveredDevicePaneComponent } from './discovered-device-pane.component'
import { Device } from '../../../models/models'

describe('DiscoveredDevicePaneComponent', () => {
  let fixture: ComponentFixture<DiscoveredDevicePaneComponent>
  let component: DiscoveredDevicePaneComponent

  const baseDevice: Device = {
    hostname: 'lab-pc-07',
    friendlyName: '',
    icon: 1,
    connectionStatus: false,
    guid: '4c4c4544-0042-3510-8048-b4c04f4d3633',
    tags: [],
    mpsInstance: '',
    mpsusername: '',
    tenantId: '',
    dnsSuffix: ''
  }

  const render = (device: Device): void => {
    fixture.componentRef.setInput('device', device)
    fixture.componentRef.setInput('productType', 'vPro')
    fixture.detectChanges()
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoveredDevicePaneComponent],
      providers: [provideTranslateService()]
    }).compileComponents()
    fixture = TestBed.createComponent(DiscoveredDevicePaneComponent)
    component = fixture.componentInstance
  })

  it('shows an empty message when the device reported no details', () => {
    render(baseDevice)
    expect(component.sections()).toEqual([])
    expect(fixture.nativeElement.querySelector('[data-cy="discoveredPaneEmpty"]')).toBeTruthy()
  })

  it('drops fields the device did not report', () => {
    render({
      ...baseDevice,
      deviceInfo: { fwVersion: '16.1.30', fwBuild: '', fwSku: '16392', currentMode: '', features: '', ipAddress: '' }
    })
    const amt = component.sections()[0]
    expect(amt.title).toBe('devices.discoveredPane.sectionAmt.value')
    expect(amt.rows.map((r) => r.label)).toEqual([
      'devices.discoveredPane.productType.value',
      'devices.discoveredPane.fwVersion.value',
      'devices.discoveredPane.sku.value'
    ])
  })

  it('keeps false flags instead of treating them as missing', () => {
    render({
      ...baseDevice,
      deviceInfo: {
        fwVersion: '',
        fwBuild: '',
        fwSku: '',
        currentMode: '',
        features: '',
        ipAddress: '',
        amtEnabledInBIOS: false,
        lmsInstalled: false
      }
    })
    const rows = component.sections()[0].rows
    expect(rows).toContainEqual(
      expect.objectContaining({ label: 'devices.discoveredPane.amtEnabledInBIOS.value', value: false })
    )
    expect(rows).toContainEqual(expect.objectContaining({ label: 'devices.discoveredPane.lms.value', value: false }))
  })

  it('shows the LMS version when LMS is installed', () => {
    render({
      ...baseDevice,
      deviceInfo: {
        fwVersion: '',
        fwBuild: '',
        fwSku: '',
        currentMode: '',
        features: '',
        ipAddress: '',
        lmsInstalled: true,
        lmsVersion: '2410.5.0.0'
      }
    })
    expect(component.sections()[0].rows).toContainEqual(
      expect.objectContaining({ label: 'devices.discoveredPane.lms.value', value: '2410.5.0.0' })
    )
  })

  it('orders sections platform, AMT, OS, network and nests UPID and interfaces as subsections', () => {
    render({
      ...baseDevice,
      deviceInfo: {
        fwVersion: '16.1.30',
        fwBuild: '',
        fwSku: '',
        currentMode: '',
        features: '',
        ipAddress: '',
        upid: { csmeId: '4A45A39C5ED9462082510000', oemPlatformIdType: 'Not Set (0)', oemId: '' },
        certHashes: ['e7685634', 'eb04cf5e'],
        osDistro: 'Ubuntu 24.04 LTS',
        cpuModel: 'Intel(R) Core(TM) Ultra 7 165H',
        meNetwork: { wired: { ipAddress: '10.0.0.12', macAddress: 'a4:bb:6d:01:02:03' } },
        osNetwork: { wired: [{ name: 'eth0', ipAddress: '10.0.0.40' }] },
        platformAdapters: { wired: ['Intel I219-LM'] }
      }
    })
    const [
      platform,
      amt,
      os,
      network
    ] = component.sections()
    expect(component.sections().map((s) => s.title)).toEqual([
      'devices.discoveredPane.sectionPlatform.value',
      'devices.discoveredPane.sectionAmt.value',
      'devices.discoveredPane.sectionOs.value',
      'devices.discoveredPane.sectionNetwork.value'
    ])

    // Empty UPID parts are dropped; the CSME ID is an identifier, so it renders monospace.
    const upid = amt.subsections?.[0]
    expect(upid?.title).toBe('devices.discoveredPane.sectionUpid.value')
    expect(upid?.rows.find((r) => r.label === 'devices.discoveredPane.upidOemId.value')).toBeUndefined()
    expect(upid?.rows.find((r) => r.label === 'devices.discoveredPane.upidCsmeId.value')?.mono).toBe(true)
    expect(amt.certHashes).toEqual(['e7685634', 'eb04cf5e'])

    // The processor is platform hardware, not part of the OS.
    expect(os.rows.map((r) => r.label)).not.toContain('devices.discoveredPane.cpuModel.value')
    expect(platform.rows.map((r) => r.label)).toContain('devices.discoveredPane.cpuModel.value')

    // Network groups interfaces by who reported them; ones with nothing reported (AMT wireless here) are dropped.
    const [amtNet, osNet] = network.subsections ?? []
    expect(amtNet.title).toBe('devices.discoveredPane.sectionAmt.value')
    expect(amtNet.subsections?.map((s) => s.title)).toEqual(['common.wired.value'])
    expect(osNet.title).toBe('devices.discoveredPane.sectionOs.value')
    expect(osNet.subsections?.map((s) => s.title)).toEqual(['devices.discoveredPane.sectionOsWired.value'])
    expect(osNet.subsections?.[0].titleParams).toEqual({ name: 'eth0' })
  })

  it('drops a network group when none of its interfaces reported anything', () => {
    render({
      ...baseDevice,
      deviceInfo: {
        fwVersion: '',
        fwBuild: '',
        fwSku: '',
        currentMode: '',
        features: '',
        ipAddress: '',
        osNetwork: { wired: [{ name: 'eth0', ipAddress: '10.0.0.40' }] }
      }
    })
    const network = component.sections().find((s) => s.title === 'devices.discoveredPane.sectionNetwork.value')
    expect(network?.subsections?.map((s) => s.title)).toEqual(['devices.discoveredPane.sectionOs.value'])
  })

  it('shows certificate hashes in a collapsed panel', () => {
    render({
      ...baseDevice,
      deviceInfo: {
        fwVersion: '',
        fwBuild: '',
        fwSku: '',
        currentMode: '',
        features: '',
        ipAddress: '',
        certHashes: ['aa', 'bb']
      }
    })
    const panel = fixture.nativeElement.querySelector('[data-cy="discoveredPaneCertHashes"]')
    expect(panel).toBeTruthy()
    expect(panel.classList).not.toContain('mat-expanded')
    expect(panel.textContent).toContain('(2)')
  })

  it('shows the GUID under the hostname', () => {
    render(baseDevice)
    expect(fixture.nativeElement.querySelector('[data-cy="discoveredPaneGuid"]').textContent.trim()).toBe(
      baseDevice.guid
    )
  })

  it('emits closed from the close button and on Escape', () => {
    render(baseDevice)
    const closed = vi.fn()
    component.closed.subscribe(closed)
    fixture.nativeElement.querySelector('[data-cy="discoveredPaneClose"]').click()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(closed).toHaveBeenCalledTimes(2)
  })

  it('moves focus to the device name when it opens', () => {
    render(baseDevice)
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-cy="discoveredPaneTitle"]'))
  })
})
