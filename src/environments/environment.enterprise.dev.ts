/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const environment = {
  production: false,
  cloud: false,
  useOAuth: false, // for use with console
  mpsServer: 'http://localhost:8181',
  rpsServer: 'http://localhost:8181',
  vault: '',
  auth: {
    clientId: '##CLIENTID##',
    issuer: '##ISSUER##',
    redirectUri: '##REDIRECTURI##',
    scope: '##SCOPE##',
    responseType: 'code',
    requireHttps: false
  }
}
