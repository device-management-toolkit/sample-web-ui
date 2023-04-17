/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { DataWithCount, FormOption } from '../../models/models'

// https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/HTMLDocuments/WS-Management_Class_Reference/AMT_RemoteAccessService.htm
// InfoMap -> ServerAddressFormat
// ValueMap={3, 4, 201}
// Values={IPv4 Address, IPv6 Address, FQDN}
//   IPv4 = 3,
//   IPv6 = 4,
//   FQDN = 201,

export type AuthMethod = FormOption<number>

export const AuthMethods = {
  MUTUAL: { value: 1, label: 'Mutual Authentication' },
  USERNAME_PASSWORD: { value: 2, label: 'Username Password Authentication' },
  labelForValue (value: number): string {
    return this.all().filter(p => p.value === value).map(p => p.label)[0]
  },
  all (): ServerAddressFormat[] {
    return [this.MUTUAL, this.USERNAME_PASSWORD]
  }
}

export type ServerAddressFormat = FormOption<number>

export const ServerAddressFormats = {
  IPv4: { value: 3, label: 'IPv4' },
  IPv6: { value: 4, label: 'IPv6' },
  FQDN: { value: 201, label: 'FQDN' },
  labelForValue (value: number): string {
    return this.all().filter(p => p.value === value).map(p => p.label)[0]
  },
  all (): ServerAddressFormat[] {
    return [this.IPv4, this.FQDN]
  }
}

export interface Config {
  configName: string
  mpsServerAddress: string
  mpsPort: number
  username: string
  password?: string
  commonName: string
  serverAddressFormat: number
  authMethod: number
  mpsRootCertificate: string
  regeneratePassword?: boolean
  version?: string
}

export type ConfigsResponse = DataWithCount<Config>
