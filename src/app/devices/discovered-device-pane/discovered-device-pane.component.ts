/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AfterViewInit, Component, ElementRef, ViewChild, computed, input, output } from '@angular/core'
import { DatePipe, NgTemplateOutlet } from '@angular/common'
import { MatIconButton } from '@angular/material/button'
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion'
import { MatIcon } from '@angular/material/icon'
import { TranslatePipe } from '@ngx-translate/core'
import { Device, DeviceInfo, MEInterfaceInfo, OSInterfaceInfo } from '../../../models/models'

// Translation key for a fixed value rpc-go reports in English.
export interface PaneLabel {
  key: string
}
// A value is plain text, a yes/no flag, or a label; the template translates the last two.
export type PaneValue = string | boolean | PaneLabel
export interface PaneRow {
  label: string
  value: PaneValue
  // Identifiers (MAC, UUIDs, hashes) render in monospace so similar characters stay distinguishable.
  mono?: boolean
}
export interface PaneSection {
  title: string
  titleParams?: Record<string, string>
  rows: PaneRow[]
  subsections?: PaneSection[]
  // Too long to read as a row, so they get a full-width collapsible panel.
  certHashes?: string[]
}

// UPID keys rpc-go reports; anything else falls back to the raw key.
const UPID_LABELS: Record<string, string> = {
  csmeId: 'devices.discoveredPane.upidCsmeId.value',
  oemId: 'devices.discoveredPane.upidOemId.value',
  oemPlatformIdType: 'devices.discoveredPane.upidOemPlatformIdType.value'
}

// Fixed values rpc-go reports, keyed in lower case. Anything else is shown as reported.
// The TLS modes match the profile page's, so they share its labels.
const TLS_MODE_LABELS: Record<string, string> = {
  server: 'tlsModes.serverAuthOnly.value',
  serverandnontls: 'tlsModes.serverAndNonTls.value',
  mutual: 'tlsModes.mutualTlsOnly.value',
  mutualandnontls: 'tlsModes.mutualAndNonTls.value',
  none: 'devices.discoveredPane.tlsModeNone.value',
  unknown: 'common.unknown.value'
}
const LINK_STATUS_LABELS: Record<string, string> = {
  up: 'devices.discoveredPane.linkStatusUp.value',
  down: 'devices.discoveredPane.linkStatusDown.value'
}
const DHCP_MODE_LABELS: Record<string, string> = {
  active: 'devices.discoveredPane.dhcpModeActive.value',
  passive: 'devices.discoveredPane.dhcpModePassive.value'
}

/**
 * Read-only details for a device rpc-go has discovered and reported to console,
 * but that is not managed by Console. Everything shown is what rpc-go reported;
 * nothing here talks to AMT, because console has no credentials for it yet.
 */
@Component({
  selector: 'app-discovered-device-pane',
  templateUrl: './discovered-device-pane.component.html',
  styleUrls: ['./discovered-device-pane.component.scss'],
  imports: [
    DatePipe,
    NgTemplateOutlet,
    MatIconButton,
    MatIcon,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    TranslatePipe
  ],
  host: {
    role: 'complementary',
    '[attr.aria-labelledby]': '"discovered-pane-title"',
    '(document:keydown.escape)': 'closed.emit()'
  }
})
export class DiscoveredDevicePaneComponent implements AfterViewInit {
  public readonly device = input.required<Device>()
  public readonly productType = input('')
  // The devices table's control mode for this device, so both show the same label.
  public readonly controlMode = input('')
  public readonly closed = output<void>()

  @ViewChild('title') title?: ElementRef<HTMLElement>

  public readonly info = computed<DeviceInfo | undefined>(() => this.device().deviceInfo)

  public readonly sections = computed<PaneSection[]>(() => {
    const info = this.info()
    if (!info) return []
    return [
      this.platformSection(info),
      this.amtSection(info),
      this.osSection(info),
      this.networkSection(info)
    ]
      .map((s) => this.prune(s))
      .filter((s): s is PaneSection => s !== null)
  })

  ngAfterViewInit(): void {
    // Move focus into the pane so keyboard and screen reader users land on what just opened.
    this.title?.nativeElement.focus()
  }

  isFlag(value: PaneValue): value is boolean {
    return typeof value === 'boolean'
  }

  isLabel(value: PaneValue): value is PaneLabel {
    return typeof value === 'object'
  }

  private label(raw: string | undefined, labels: Record<string, string>): PaneValue | undefined {
    const key = raw ? labels[raw.trim().toLowerCase()] : undefined
    return key ? { key } : raw
  }

  // An unrecognised mode keeps its reported text rather than collapsing to "unknown".
  private controlModeValue(raw: string | undefined): PaneValue | undefined {
    const mode = this.controlMode()
    return raw && mode && mode !== 'unknown' ? { key: `devices.controlMode.${mode}.value` } : raw
  }

  private amtSection(info: DeviceInfo): PaneSection {
    const lms =
      info.lmsInstalled === undefined
        ? undefined
        : info.lmsInstalled && info.lmsVersion
          ? info.lmsVersion
          : info.lmsInstalled
    const upid: PaneRow[] = []
    for (const [key, raw] of Object.entries(info.upid ?? {})) {
      const value = typeof raw === 'string' ? raw : JSON.stringify(raw)
      if (value) upid.push({ label: UPID_LABELS[key] ?? key, value, mono: key === 'csmeId' })
    }
    return {
      title: 'devices.discoveredPane.sectionAmt.value',
      rows: this.rows([
        ['productType', this.productType()],
        ['fwVersion', info.fwVersion],
        ['fwBuild', info.fwBuild],
        ['sku', info.fwSku],
        ['amtEnabledInBIOS', info.amtEnabledInBIOS],
        ['currentMode', this.controlModeValue(info.currentMode)],
        ['features', info.features],
        ['ipAddress', info.ipAddress],
        ['dhcpEnabled', info.dhcpEnabled],
        ['tlsMode', this.label(info.tlsMode, TLS_MODE_LABELS)],
        ['heciAvailable', info.heciAvailable],
        ['meInterfaceVersion', info.meInterfaceVersion],
        ['lms', lms],
        // Without admin rights rpc-go can't read Intel AMT, so this explains any details missing above.
        ['isElevated', info.isElevated]
      ]),
      subsections: [{ title: 'devices.discoveredPane.sectionUpid.value', rows: upid }],
      certHashes: info.certHashes
    }
  }

  private osSection(info: DeviceInfo): PaneSection {
    return {
      title: 'devices.discoveredPane.sectionOs.value',
      rows: this.rows([
        ['os', [info.osName, info.osDistro].filter(Boolean).join(' / ')],
        ['osVersion', info.osVersion],
        ['ipAddress', info.osIpAddress],
        ['dnsSuffix', info.dnsSuffixOS],
        ['monitorConnected', info.monitorConnected],
        ['ieee8021xEnabled', info.ieee8021xEnabled]
      ])
    }
  }

  // Intel AMT and the OS each see the network on their own, so both sets of interfaces are listed.
  private networkSection(info: DeviceInfo): PaneSection {
    return {
      title: 'devices.discoveredPane.sectionNetwork.value',
      rows: [],
      subsections: [
        { title: 'devices.discoveredPane.sectionAmt.value', rows: [], subsections: this.meNetworkSections(info) },
        { title: 'devices.discoveredPane.sectionOs.value', rows: [], subsections: this.osAdapterSections(info) }
      ]
    }
  }

  // CPU and adapters sit under platform, matching console's device export.
  private platformSection(info: DeviceInfo): PaneSection {
    return {
      title: 'devices.discoveredPane.sectionPlatform.value',
      rows: this.rows([
        ['cpuModel', info.cpuModel],
        ['ethernetAdapterCount', info.ethernetAdapterCount?.toString()],
        ['wiredAdapters', info.platformAdapters?.wired?.join(', ')],
        ['wirelessAdapters', info.platformAdapters?.wireless?.join(', ')]
      ])
    }
  }

  private meNetworkSections(info: DeviceInfo): PaneSection[] {
    const iface = (title: string, net?: MEInterfaceInfo): PaneSection => ({
      title,
      rows: net
        ? this.rows([
            ['ipAddress', net.ipAddress],
            [
              'macAddress',
              net.macAddress,
              true
            ],
            ['dhcpEnabled', net.dhcpEnabled],
            ['dhcpMode', this.label(net.dhcpMode, DHCP_MODE_LABELS)],
            ['linkStatus', this.label(net.linkStatus, LINK_STATUS_LABELS)]
          ])
        : []
    })
    return [
      iface('common.wired.value', info.meNetwork?.wired),
      iface('common.wireless.value', info.meNetwork?.wireless)
    ]
  }

  private osAdapterSections(info: DeviceInfo): PaneSection[] {
    const adapter = (title: string, net: OSInterfaceInfo): PaneSection => ({
      title,
      titleParams: { name: net.name ?? '' },
      rows: this.rows([
        ['ipAddress', net.ipAddress],
        [
          'macAddress',
          net.macAddress,
          true
        ],
        ['dhcpEnabled', net.dhcpEnabled],
        ['linkStatus', this.label(net.linkStatus, LINK_STATUS_LABELS)]
      ])
    })
    const wired = (info.osNetwork?.wired ?? []).map((n) => adapter('devices.discoveredPane.sectionOsWired.value', n))
    const wireless = info.osNetwork?.wireless
      ? [adapter('devices.discoveredPane.sectionOsWireless.value', info.osNetwork.wireless)]
      : []
    return [...wired, ...wireless]
  }

  // Drops subsections (at any depth) that ended up with nothing to show, then the section itself if it is empty.
  private prune(section: PaneSection): PaneSection | null {
    const subsections = section.subsections
      ?.map((sub) => this.prune(sub))
      .filter((sub): sub is PaneSection => sub !== null)
    const empty =
      !section.rows.length && !subsections?.length && !section.certHashes?.length && !section.titleParams?.['name']
    return empty ? null : { ...section, subsections }
  }

  // Devices report different subsets of fields, so empty values are dropped rather than shown blank.
  private rows(entries: [
      string,
      PaneValue | undefined | null,
      boolean?
    ][]): PaneRow[] {
    return entries
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(
        ([
          key,
          value,
          mono
        ]) => ({
          label: `devices.discoveredPane.${key}.value`,
          value: value as PaneValue,
          mono
        })
      )
  }
}
