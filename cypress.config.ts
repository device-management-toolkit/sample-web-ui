/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { defineConfig } from 'cypress'
export default defineConfig({
  projectId: 'mxeztq',
  env: {
    BASEURL: 'http://localhost:4200/',
    ISOLATE: 'Y',
    FQDN: '192.168.8.50',
    MPS_USERNAME: 'standalone',
    MPS_PASSWORD: 'G@ppm0ym',
    AMT_PASSWORD: 'P@ssw0rd',
    MEBX_PASSWORD: 'P@ssw0rd',
    WIFI_SSID: 'test',
    WIFI_PSK_PASSPHRASE: 'P@ssw0rd',
    VAULT_ADDRESS: 'http://localhost:8200',
    VAULT_TOKEN: 'myroot',
    PROVISIONING_CERT: 'cert',
    PROVISIONING_CERT_PASSWORD: 'password',
  },
  chromeWebSecurity: false,
  e2e: {
    specPattern: 'cypress/e2e/integration/**/*.ts',
    setupNodeEvents (on, config) {
      // implement node event listeners here
    }
  }
})
