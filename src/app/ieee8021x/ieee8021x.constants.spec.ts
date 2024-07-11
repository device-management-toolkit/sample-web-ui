/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from '../../models/models'
import { AuthenticationProtocols } from './ieee8021x.constants'

describe('Test AuthenticationProtocols Constants', () => {
  AuthenticationProtocols.all().forEach((m: FormOption<number>) => {
    it(`should have label: ${m.label} for value: ${m.value}`, () => {
      expect(AuthenticationProtocols.labelForValue(m.value)).toEqual(m.label)
    })
  })
})
