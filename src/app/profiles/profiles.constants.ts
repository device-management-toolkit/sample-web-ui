/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from 'src/models/models'

export const ActivationModes: FormOption<string>[] = [
  { value: 'acmactivate', label: 'profileDetail.activationModeAdmin.value' },
  { value: 'ccmactivate', label: 'profileDetail.activationModeClient.value' }
]

export const UserConsentModes: FormOption<string>[] = [
  { value: 'All', label: 'userConsentModes.all.value' },
  { value: 'KVM', label: 'userConsentModes.kvmOnly.value' },
  { value: 'None', label: 'userConsentModes.none.value' }
]

export const TlsModes: FormOption<number>[] = [
  { value: 1, label: 'tlsModes.serverAuthOnly.value' },
  { value: 2, label: 'tlsModes.serverAndNonTls.value' },
  { value: 3, label: 'tlsModes.mutualTlsOnly.value' },
  { value: 4, label: 'tlsModes.mutualAndNonTls.value' }
]

export const TlsSigningAuthorities: FormOption<string>[] = [
  { value: 'SelfSigned', label: 'tlsAuthorities.selfSigned.value' },
  { value: 'MicrosoftCA', label: 'tlsAuthorities.microsoftCA.value' }
]

// unfortunately wifiConfigs is what the REST interface expects
// even though not really a wireless config
export interface WiFiConfig {
  profileName: string
  priority: number
}

export interface proxyConfig {
  priority: number
  name: string
}

export interface Profile {
  proxyConfigs?: proxyConfig[]
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
  uefiWifiSyncEnabled: boolean
}
