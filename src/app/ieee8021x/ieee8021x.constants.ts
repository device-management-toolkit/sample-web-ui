/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

export interface AuthenticationProtocol {
  value: number
  label: string
}

export const AuthenticationProtocols = {
  EAP_TLS: { value: 0, label: 'EAP-TLS' },
  EAP_GTC: { value: 3, label: 'EAP-GTC' },
  EAP_FAST_GTC: { value: 5, label: 'EAP-FAST/GTC' },
  EAP_FAST_TLS: { value: 10, label: 'EAP-FAST/TLS' },
  labelForValue (value: number): string {
    if (value === this.EAP_TLS.value) { return this.EAP_TLS.label }
    if (value === this.EAP_GTC.value) { return this.EAP_GTC.label }
    if (value === this.EAP_FAST_GTC.value) { return this.EAP_FAST_GTC.label }
    if (value === this.EAP_FAST_TLS.value) { return this.EAP_FAST_TLS.label }
    return ''
  },
  toArray (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.EAP_GTC,
      this.EAP_FAST_GTC,
      this.EAP_FAST_TLS
    ]
  }
}

export interface CountByInterface {
  wired: number
  wireless: number
}

export interface Config {
  profileName: string
  authenticationProtocol: number
  pxeTimeout: number
  wiredInterface: boolean
  version: string
}

export interface ConfigsResponse {
  data: Config[]
  totalCount: number
}
