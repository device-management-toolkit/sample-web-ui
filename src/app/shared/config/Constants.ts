/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

export const ActivationModes = {
  ADMIN: { value: 'acmactivate', label: 'Admin Control Mode' },
  CLIENT: { value: 'ccmactivate', label: 'Client Control Mode' },
  labelForValue (value: string): string {
    if (value === this.ADMIN.value) { return this.ADMIN.label }
    if (value === this.CLIENT.value) { return this.CLIENT.label }
    return ''
  }
}
export const ConnectionModes = {
  CIRA: { value: 'CIRA', label: 'CIRA (Cloud)' },
  TLS: { value: 'TLS', label: 'TLS (Enterprise)' },
  labelForValue (value: string): string {
    if (value === this.CIRA.value) { return this.CIRA.label }
    if (value === this.TLS.value) { return this.TLS.label }
    return ''
  }
}
export const DhcpModes = {
  DHCP: { value: true, label: 'DHCP' },
  STATIC: { value: false, label: 'Static' },
  labelForValue (value: boolean): string {
    if (value === this.DHCP.value) { return this.DHCP.label }
    if (value === this.STATIC.value) { return this.STATIC.label }
    return ''
  }
}
export const TlsModes = {
  SERVER: { value: 1, label: 'Server Authentication Only' },
  SERVER_NON_TLS: { value: 2, label: 'Server & Non-TLS Authentication' },
  MUTUAL: { value: 3, label: 'Mutual TLS Authentication Only' },
  MUTUAL_NON_TLS: { value: 4, label: 'Mutual and Non-TLS Authentication' },
  labelForValue (value: number): string {
    if (value === this.SERVER.value) { return this.SERVER.label }
    if (value === this.SERVER_NON_TLS.value) { return this.SERVER_NON_TLS.label }
    if (value === this.MUTUAL.value) { return this.MUTUAL.label }
    if (value === this.MUTUAL_NON_TLS.value) { return this.MUTUAL_NON_TLS.label }
    return ''
  }
}
export const UserConsentModes = {
  ALL: { value: 'All', label: 'All' },
  KVM: { value: 'KVM', label: 'KVM Only' },
  NONE: { value: 'None', label: 'None' },
  labelForValue (value: string): string {
    if (value === this.ALL.value) { return this.ALL.label }
    if (value === this.KVM.value) { return this.KVM.label }
    if (value === this.NONE.value) { return this.NONE.label }
    return ''
  }
}

type EventTypeMap = Record<number, string>
const EVENTTYPEMAP: EventTypeMap = {
  1: 'Threshold based event',
  7: 'Generic severity event',
  10: 'Linkup Event',
  111: 'Sensor specific event'
}

export default {
  /** @deprecated */
  ACMActivate: 'acmactivate',
  /** @deprecated */
  CCMActivate: 'ccmactivate',
  NORESULTS: 'No Wifi Configs Found',
  EVENTTYPEMAP,
  /** @deprecated */
  ConnectionMode_TLS: 'TLS',
  /** @deprecated */
  ConnectionMode_CIRA: 'CIRA',
  // these redirection values must match AMTUserConsent values
  /** @deprecated */
  UserConsent_None: 'None',
  /** @deprecated */
  UserConsent_All: 'All',
  /** @deprecated */
  UserConsent_KVM: 'KVM',
  ActivationModes,
  ConnectionModes,
  DhcpModes,
  TlsModes,
  UserConsentModes
}
