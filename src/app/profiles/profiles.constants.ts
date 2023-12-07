/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { DataWithCount, FormOption } from 'src/models/models'

export type ActivationMode = FormOption<string>
export const ActivationModes = {
  ADMIN: { value: 'acmactivate', label: 'Admin Control Mode' },
  CLIENT: { value: 'ccmactivate', label: 'Client Control Mode' },
  labelForValue (value: string): string {
    const e = this.all().find(e => e.value === value)
    return e ? e.label : ''
  },
  all (): ActivationMode[] { return [this.ADMIN, this.CLIENT] }
}

export type ConnectionMode = FormOption<string>
export const ConnectionModes = {
  CIRA: { value: 'CIRA', label: 'CIRA (Cloud)' },
  TLS: { value: 'TLS', label: 'TLS (Enterprise)' },
  labelForValue (value: string): string {
    const e = this.all().find(e => e.value === value)
    return e ? e.label : ''
  },
  all (): ConnectionMode[] { return [this.CIRA, this.TLS] }
}

export type DhcpMode = FormOption<boolean>
export const DhcpModes = {
  DHCP: { value: true, label: 'DHCP' },
  STATIC: { value: false, label: 'Static' },
  labelForValue (value: boolean): string {
    const e = this.all().find(e => e.value === value)
    return e ? e.label : ''
  },
  all (): DhcpMode[] { return [this.DHCP, this.STATIC] }
}

export type TlsMode = FormOption<number>
export const TlsModes = {
  SERVER: { value: 1, label: 'Server Authentication Only' },
  SERVER_NON_TLS: { value: 2, label: 'Server & Non-TLS Authentication' },
  MUTUAL: { value: 3, label: 'Mutual TLS Authentication Only' },
  MUTUAL_NON_TLS: { value: 4, label: 'Mutual and Non-TLS Authentication' },
  labelForValue (value: number): string {
    const e = this.all().find(e => e.value === value)
    return e ? e.label : ''
  },
  all (): TlsMode[] {
    return [this.SERVER, this.SERVER_NON_TLS, this.MUTUAL, this.MUTUAL_NON_TLS]
  }
}

export type TlsSigningAuthority = FormOption<string>
export const TlsSigningAuthorities = {
  SELF_SIGNED: {
    label: 'Use Self-Signed Cert',
    value: 'SelfSigned'
  },
  MICROSOFT_CA: {
    label: 'Use Microsoft CA Signed Cert (Requires Enterprise Assistant)',
    value: 'MicrosoftCA'
  },
  labelForValue (value: string): string {
    const e = this.all().find(e => e.value === value)
    return e ? e.label : ''
  },
  all (): TlsSigningAuthority[] { return [this.SELF_SIGNED, this.MICROSOFT_CA] }
}

export type UserConsent = FormOption<string>
export const UserConsentModes = {
  ALL: { value: 'All', label: 'All' },
  KVM: { value: 'KVM', label: 'KVM Only' },
  NONE: { value: 'None', label: 'None' },
  labelForValue (value: string): string {
    const e = this.all().find(e => e.value === value)
    return e ? e.label : ''
  },
  all (): UserConsent[] { return [this.ALL, this.KVM, this.NONE] }
}

// unfortunately wifiConfigs is what the REST interface expects
// even though not really a wireless config
export interface WiFiConfig {
  profileName: string
  priority: number
}

export interface Profile {
  profileName: string
  activation: string
  iderEnabled: boolean
  kvmEnabled: boolean
  solEnabled: boolean
  userConsent: string
  generateRandomPassword: boolean
  amtPassword?: string
  generateRandomMEBxPassword: boolean
  mebxPassword?: string
  dhcpEnabled: boolean
  ipSyncEnabled: boolean
  localWifiSyncEnabled: boolean
  ieee8021xProfileName?: string
  wifiConfigs?: WiFiConfig[]
  tags: string[]
  tlsMode?: number
  tlsSigningAuthority?: string
  ciraConfigName?: string
  version?: string
}

export type ProfilesResponse = DataWithCount<Profile>
