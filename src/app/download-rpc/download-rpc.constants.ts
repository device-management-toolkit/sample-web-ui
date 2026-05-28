/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FormOption } from '../../models/models'

export type RpcCommand = 'activate' | 'deactivate'
export type AuthMode = 'token' | 'userpass'

export const RpcCommands: FormOption<RpcCommand>[] = [
  { value: 'activate', label: 'downloadRpc.command.activate.value' },
  { value: 'deactivate', label: 'downloadRpc.command.deactivate.value' }
]

export const AuthModes: FormOption<AuthMode>[] = [
  { value: 'token', label: 'downloadRpc.auth.token.value' },
  { value: 'userpass', label: 'downloadRpc.auth.userpass.value' }
]

// One downloadable build for a release, as returned by Console.
export interface RpcAsset {
  os: string // e.g. 'linux' | 'windows' | 'darwin'
  arch: string // e.g. 'x86_64' | 'arm64'
}

// A single rpc-go release (v3+, betas included) returned by Console.
export interface RpcRelease {
  version: string
  assets: RpcAsset[]
}

export interface PackageAuth {
  mode: AuthMode
  username?: string
  password?: string
}

// Body posted to POST /api/package.
export interface PackageRequest {
  command: RpcCommand
  version: string
  os: string
  arch: string
  auth: PackageAuth
  profile?: string // activate only
  domain?: string // activate + ACM only
}

// Best-effort OS guess for pre-selecting the asset dropdown. Returns one of
// the asset os tokens Console uses ('windows' | 'darwin' | 'linux').
export function detectOS(): string {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  // navigator.platform is deprecated but is the only fallback for browsers
  // that lack userAgentData (Firefox, Safari); used here as a best-effort default.
  const platform = (nav.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase()
  if (platform.includes('win')) {
    return 'windows'
  }
  if (platform.includes('mac') || platform.includes('darwin')) {
    return 'darwin'
  }
  return 'linux'
}
