/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  cloud: true,
  useOAuth: false, // for use with console
  mpsServer: 'http://localhost:3000',
  rpsServer: 'http://localhost:8081',
  vault: 'http://localhost/vault',
  auth: {
    clientId: '',
    issuer: '',
    redirectUri: 'http://localhost:4200/dashboard',
    scope: '',
    responseType: 'code',
    requireHttps: true // set to false when local
  }
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
