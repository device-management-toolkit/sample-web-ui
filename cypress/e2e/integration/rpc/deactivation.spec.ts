/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { isCloud } from './rpc.helpers'

declare const require: (id: string) => unknown

if (isCloud) {
  require('./cloud.deactivation.spec')
} else {
  require('./console.deactivation.spec')
}