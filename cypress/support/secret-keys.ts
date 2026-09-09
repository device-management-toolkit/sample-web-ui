/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Config keys treated as credentials. The Cypress configs withhold these from
// "expose" (which is serialized into the browser) and secrets.ts fetches them
// from "env" instead. One shared list, since a key excluded from expose but
// never fetched would leave tests typing an empty password.
//
// No imports and no Cypress globals here: both the Node-side configs and the
// browser-side support code load this. Keys a config does not define are
// ignored, so both suites share the list.
export const SECRET_ENV_KEYS = [
  'AMT_PASSWORD',
  'ENCRYPTION_KEY',
  'MEBX_PASSWORD',
  'MPS_PASSWORD',
  'PROVISIONING_CERT',
  'PROVISIONING_CERT_PASSWORD',
  'REDFISH_PASSWORD',
  'VAULT_TOKEN',
  'WIFI_PSK_PASSPHRASE'
]
