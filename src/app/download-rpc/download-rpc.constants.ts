/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption, RpcAuthMode, RpcCommand } from '../../models/models'

export const RpcCommands: FormOption<RpcCommand>[] = [
  { value: 'activate', label: 'downloadRpc.command.activate.value' },
  { value: 'deactivate', label: 'downloadRpc.command.deactivate.value' }
]

// 'none' leaves the package without credentials; the operator supplies them on the device.
export const AuthModes: FormOption<RpcAuthMode>[] = [
  { value: 'none', label: 'downloadRpc.auth.none.value' },
  { value: 'token', label: 'downloadRpc.auth.token.value' }
]

// Console rejects lifetimes above its package.max_token_ttl.
export const TokenLifetimes: FormOption<string>[] = [
  { value: '15m', label: 'downloadRpc.tokenTtl.15m.value' },
  { value: '1h', label: 'downloadRpc.tokenTtl.1h.value' },
  { value: '8h', label: 'downloadRpc.tokenTtl.8h.value' },
  { value: '24h', label: 'downloadRpc.tokenTtl.24h.value' }
]

// Offered in this order; the first one available in a release is pre-selected.
export const OsOptions: FormOption<string>[] = [
  { value: 'windows', label: 'downloadRpc.os.windows.value' },
  { value: 'linux', label: 'downloadRpc.os.linux.value' },
  { value: 'both', label: 'downloadRpc.os.both.value' }
]

// Only x64 rpc-go builds are packaged.
export const RpcArch = 'x64'
