/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const environment = {
  production: true,
  cloud: true,
  useOAuth: ('##AUTH_MODE_ENABLED##' as string) === 'true', // for use with console
  mpsServer: '##MPS_SERVER##',
  rpsServer: '##RPS_SERVER##',
  vault: '##VAULT_SERVER##',
  redirTokenRefreshThresholdMs: 5_000,
  auth: {}
}
