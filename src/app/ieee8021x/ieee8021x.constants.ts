/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from '../../models/models'

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

export const AuthenticationProtocols: FormOption<number>[] = [
  { value: 0, mode: 'both', label: 'EAP-TLS' },
  { value: 1, mode: 'wired', label: 'EAP-TTLS/MSCHAPv2' },
  { value: 2, mode: 'both', label: 'PEAPv0/EAP-MSCHAPv2' },
  { value: 3, mode: 'wired', label: 'PEAPv1/EAP-GTC' },
  { value: 4, mode: 'wired', label: 'EAP-FAST/MSCHAPv2' },
  { value: 5, mode: 'wired', label: 'EAP-FAST/GTC' },
  { value: 6, mode: 'wired', label: 'EAP-MD5' },
  { value: 7, mode: 'wired', label: 'EAP-PSK' },
  { value: 8, mode: 'wired', label: 'EAP-SIM' },
  { value: 9, mode: 'wired', label: 'EAP-AKA' },
  { value: 10, mode: 'wired', label: 'EAP-FAST/TLS' }
]
