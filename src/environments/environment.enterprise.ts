/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const environment = {
  production: true,
  cloud: false,
  useOAuth: ('##AUTH_MODE_ENABLED##' as string) === 'true', // for use with console
  mpsServer: '##CONSOLE_SERVER_API##',
  rpsServer: '##CONSOLE_SERVER_API##',
  vault: '##VAULT_SERVER##',
  redirTokenRefreshThresholdMs: 5_000,
  auth: {
    clientId: '##CLIENTID##',
    issuer: '##ISSUER##',
    redirectUri: '##REDIRECTURI##',
    scope: '##SCOPE##',
    responseType: 'code',
    requireHttps: true, // set to false when local
    strictDiscoveryDocumentValidation: true
  }
}
