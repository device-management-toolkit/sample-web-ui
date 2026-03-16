/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const environment = {
  production: true,
  cloud: true,
  useOAuth: false, // for use with console
  mpsServer: '##MPS_SERVER##',
  rpsServer: '##RPS_SERVER##',
  vault: '##VAULT_SERVER##',
  amtFeaturesCacheTtlMs: 30_000, // 30 s default; max 3 min (180_000)
  auth: {}
}
