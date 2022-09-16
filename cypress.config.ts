/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { defineConfig } from 'cypress'

export default defineConfig({
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress-ui-test-output-[hash].xml'
  },
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
    PROVISIONING_CERT: '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',
    PROVISIONING_CERT_PASSWORD: 'Intel123!',
    DOMAIN_SUFFIX: 'mlopshub.com'
  },
  chromeWebSecurity: false,
  e2e: {
    screenshotOnRunFailure: false,
    specPattern: 'cypress/e2e/integration/**/*.ts'
  }
})
