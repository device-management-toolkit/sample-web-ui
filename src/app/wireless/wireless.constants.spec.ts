/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { DataWithCount, FormOption } from '../../models/models'
import { AuthenticationMethods, EncryptionMethods } from './wireless.constants'

describe('Test AuthenticationMethods Constants', () => {
  AuthenticationMethods.all().forEach((m: FormOption<number>) => {
    it(`should have label: ${m.label} for value: ${m.value}`, () => {
      expect(AuthenticationMethods.labelForValue(m.value)).toEqual(m.label)
    })
  })

  AuthenticationMethods.allExceptIEEE8021X().forEach((m: FormOption<number>) => {
    it(`${m.label} method should not be IEEE8021X`, () => {
      expect(AuthenticationMethods.isIEEE8021X(m.value)).toBeFalse()
      expect(AuthenticationMethods.isPSK(m.value)).toBeTrue()
    })
  })
})

describe('Test EncryptionMethodOpts Constants', () => {
  EncryptionMethods.all().forEach((m: FormOption<number>) => {
    it(`should have label: ${m.label} for value: ${m.value}`, () => {
      expect(EncryptionMethods.labelForValue(m.value)).toEqual(m.label)
    })
  })
})

export interface Config {
  profileName: string
  authenticationMethod: number
  encryptionMethod: number
  ssid: string
  pskValue?: string
  ieee8021xProfileName?: string
  version?: string
}

export type ConfigsResponse = DataWithCount<Config>
