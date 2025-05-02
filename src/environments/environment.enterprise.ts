/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const environment = {
  production: true,
  cloud: false,
  useOAuth: false, // for use with console
  mpsServer: '##CONSOLE_SERVER_API##',
  rpsServer: '##CONSOLE_SERVER_API##',
  vault: '##VAULT_SERVER##',
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
