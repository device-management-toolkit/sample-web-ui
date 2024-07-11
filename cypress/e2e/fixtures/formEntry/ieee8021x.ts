/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AuthenticationProtocols, Config } from 'src/app/ieee8021x/ieee8021x.constants'

export const wiredConfigs: Config[] = []
AuthenticationProtocols.forWiredInterface().forEach((authProtocol) => {
  ;[0, 60 * 60 * 24].forEach((pxeTimeout) => {
    wiredConfigs.push({
      profileName: `8021xWiredProto${authProtocol.value}Pxe${pxeTimeout}`,
      wiredInterface: true,
      authenticationProtocol: authProtocol.value,
      pxeTimeout
    })
  })
})

export const wirelessConfigs: Config[] = []
AuthenticationProtocols.forWirelessInterface().forEach((authProtocol) => {
  // at this release, only one protocol is supported, but would like to ensure
  // multiple wireless configurations can be created, so use a couple of names
  ;[
    'cfg01',
    'cfg02',
    'cfg03'
  ].forEach((nameSuffix) => {
    wirelessConfigs.push({
      profileName: `8021xWirelessProto${authProtocol.value}${nameSuffix}`,
      wiredInterface: false,
      authenticationProtocol: authProtocol.value,
      pxeTimeout: 0
    })
  })
})
