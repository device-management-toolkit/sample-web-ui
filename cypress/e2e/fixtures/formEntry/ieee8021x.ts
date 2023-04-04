/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { AuthenticationProtocols, Config } from '../../../../src/app/ieee8021x/ieee8021x.constants'

// for now, only one wired profile is supported
// backend won't support creating all the combos
export const allConfigs: Config[] = [
  {
    profileName: 'config01',
    authenticationProtocol: AuthenticationProtocols.EAP_TLS.value,
    pxeTimeout: 20,
    wiredInterface: true,
    version: ''
  }
]
