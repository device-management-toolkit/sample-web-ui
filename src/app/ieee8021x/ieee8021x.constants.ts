/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { DataWithCount, FormOption } from '../../models/models'

// AMT Authentication ProtocoL
// https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/HTMLDocuments/WS-Management_Class_Reference/AMT_8021XProfile.htm
// CIM Authentication ProtocoL
// https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/default.htm?turl=HTMLDocuments%2FWS-Management_Class_Reference%2FCIM_IEEE8021xSettings.htm
// IPS Authentication Protocol
// https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/default.htm?turl=HTMLDocuments%2FWS-Management_Class_Reference%2FIPS_IEEE8021xSettings.htm
// -------------------------------------------------------------------------------------
//    | AMT              | CIM                 | IPS
// -------------------------------------------------------------------------------------
//  0 | TLS              | EAP-TLS             | EAP-TLS
//  1 | TTLS_MSCHAPv2    | EAP-TTLS/MSCHAPv2   | EAP-TTLS/MSCHAPv2
//  2 | PEAP_MSCHAPv2    | PEAPv0/EAP-MSCHAPv2 | PEAPv0/EAP-MSCHAPv2
//  3 | EAP_GTC          | PEAPv1/EAP-GTC      | PEAPv1/EAP-GTC
//  4 | EAPFAST_MSCHAPv2 | EAP-FAST/MSCHAPv2   | EAP-FAST/MSCHAPv2
//  5 | EAPFAST_GTC      | EAP-FAST/GTC        | EAP-FAST/GTC
//  6 | EAPFAST_TLS      | EAP-MD5             | EAP-MD5
//  7 |                  | EAP-PSK             | EAP-PSK
//  8 |                  | EAP-SIM             | EAP-SIM
//  9 |                  | EAP-AKA             | EAP-AKA
// 10 |                  | EAP-FAST/TLS        | EAP-FAST/TLS
// 11 |                  | DMTF Reserved       | DMTF Reserved

export type AuthenticationProtocol = FormOption<number>

export const AuthenticationProtocols = {
  EAP_TLS: { value: 0, label: 'EAP-TLS' },
  EAP_TTLS_MSCHAPv2: { value: 1, label: 'EAP-TTLS/MSCHAPv2' },
  PEAP_MSCHAPv2: { value: 2, label: 'PEAPv0/EAP-MSCHAPv2' },
  PEAP_GTC: { value: 3, label: 'PEAPv1/EAP-GTC' },
  EAP_FAST_MSCHAPv2: { value: 4, label: 'EAP-FAST/MSCHAPv2' },
  EAP_FAST_GTC: { value: 5, label: 'EAP-FAST/GTC' },
  EAP_MD5: { value: 6, label: 'EAP-MD5 ' },
  EAP_PSK: { value: 7, label: 'EAP-PSK ' },
  EAP_SIM: { value: 8, label: 'EAP-SIM ' },
  EAP_AKA: { value: 9, label: 'EAP-AKA ' },
  EAP_FAST_TLS: { value: 10, label: 'EAP-FAST/TLS' },
  labelForValue (value: number): string {
    return this.all().filter(p => p.value === value).map(p => p.label)[0]
  },
  all (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.EAP_TTLS_MSCHAPv2,
      this.PEAP_MSCHAPv2,
      this.PEAP_GTC,
      this.EAP_FAST_MSCHAPv2,
      this.EAP_FAST_GTC,
      this.EAP_MD5,
      this.EAP_PSK,
      this.EAP_SIM,
      this.EAP_AKA,
      this.EAP_FAST_TLS
    ]
  },
  forWiredInterface (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.PEAP_GTC,
      this.EAP_FAST_GTC,
      this.EAP_FAST_TLS,
      this.PEAP_MSCHAPv2
    ]
  },
  forWirelessInterface (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.PEAP_MSCHAPv2
    ]
  }
}

export interface Config {
  profileName: string
  authenticationProtocol: number
  pxeTimeout: number
  wiredInterface: boolean
  version?: string
}

export type ConfigsResponse = DataWithCount<Config>
