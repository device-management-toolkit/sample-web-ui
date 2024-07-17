/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from '../../models/models'

// https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/HTMLDocuments/WS-Management_Class_Reference/CIM_WiFiEndpointSettings.htm

export const AuthenticationMethods: FormOption<number>[] = [
  { value: 4, mode: 'PSK', label: 'WPA PSK' },
  { value: 5, mode: '802.1x', label: 'WPA IEEE 802.1x' },
  { value: 6, mode: 'PSK', label: 'WPA2 PSK' },
  { value: 7, mode: '802.1x', label: 'WPA2 IEEE 802.1x' }
]

export const EncryptionMethods: FormOption<number>[] = [
  { value: 3, label: 'TKIP' },
  { value: 4, label: 'CCMP' }
]
