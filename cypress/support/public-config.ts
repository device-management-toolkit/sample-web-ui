/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Only these public values may be copied from legacy --env / CYPRESS_* inputs.
// Credentials and unrecognized keys stay in Node-side env configuration.
export const PUBLIC_ENV_KEYS = [
  'ACTIVATION_URL',
  'AUTO_ADD_DEVICE',
  'BASEURL',
  'CLOUD',
  'DEVICE',
  'DOMAIN_SUFFIX',
  'FQDN',
  'ISOLATE',
  'MPS_USERNAME',
  'PROFILE_NAME',
  'PROFILE_YAML_FILE',
  'RPC_BINARY',
  'RPC_DOCKER_IMAGE',
  'RPC_VERSION',
  'VAULT_ADDRESS',
  'WIFI_SSID'
]

export const publicConfig = (
  env: Record<string, unknown>,
  expose: Record<string, unknown> = {},
  publicKeys: readonly string[] = PUBLIC_ENV_KEYS
): Record<string, unknown> => {
  const result = { ...expose }
  for (const key of publicKeys) {
    if (result[key] === undefined && env[key] !== undefined) {
      result[key] = env[key]
    }
  }
  return result
}
