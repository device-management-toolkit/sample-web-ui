/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from 'src/models/models'

export const ActivationModes: FormOption<string>[] = [
  { value: 'acmactivate', label: 'Admin Control Mode' },
  { value: 'ccmactivate', label: 'Client Control Mode' }
]

export const TlsModes: FormOption<number>[] = [
  { value: 1, label: 'Server Authentication Only' },
  { value: 2, label: 'Server & Non-TLS Authentication' },
  { value: 3, label: 'Mutual TLS Authentication Only' },
  { value: 4, label: 'Mutual and Non-TLS Authentication' }
]

export const TlsSigningAuthorities: FormOption<string>[] = [
  { value: 'SelfSigned', label: 'Use Self-Signed Cert' },
  { value: 'MicrosoftCA', label: 'Use Microsoft CA Signed Cert (Requires Enterprise Assistant)' }
]

export const UserConsentModes: FormOption<string>[] = [
  { value: 'All', label: 'All' },
  { value: 'KVM', label: 'KVM Only' },
  { value: 'None', label: 'None' }
]

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
