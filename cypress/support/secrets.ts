/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Credential access for the Cypress suites.
 *
 * Cypress 16 splits test config: "expose" is serialized into the browser and
 * readable by the app under test, "env" is reachable only from test code via
 * the async cy.env(). SECRET_ENV_KEYS are withheld from "expose".
 *
 * This keeps credentials out of the app's own config. It is not a sandbox —
 * they are still fetched into the browser here, and Cypress serves the app
 * same-origin with the runner.
 *
 * Most call sites need a credential synchronously (a custom command, a header
 * helper, a spec's module scope) where cy.env() cannot be used, so the values
 * are loaded once per spec by the before() hook in e2e.ts and read via secret().
 */

import { SECRET_ENV_KEYS } from './secret-keys'

export { SECRET_ENV_KEYS }

interface SecretStore {
  __dmtSecrets?: Record<string, string>
}

// Cached on the Cypress singleton, not in module scope: Cypress bundles the
// support file and each spec separately, so a module-level object would give
// the spec a different instance from the one before() filled in.
const store = (): Record<string, string> => {
  const holder = Cypress as unknown as SecretStore
  if (!holder.__dmtSecrets) {
    holder.__dmtSecrets = {}
  }
  return holder.__dmtSecrets
}

/** Loads every declared credential from "env". Call from before() — cy.env() cannot run at module scope. */
export const loadSecrets = (): void => {
  cy.env(SECRET_ENV_KEYS).then((values) => {
    const cache = store()
    for (const key of SECRET_ENV_KEYS) {
      if (values[key] != null) {
        cache[key] = String(values[key])
      }
    }
  })
}

/**
 * Reads a credential loaded by loadSecrets().
 *
 * Throws on an undeclared key so a typo surfaces here rather than as an empty
 * password failing a later UI assertion. A declared key the running config does
 * not set yields '' — the two suites share one list — so use `||` for defaults.
 */
export const secret = (key: string): string => {
  if (!SECRET_ENV_KEYS.includes(key)) {
    throw new Error(
      `Unknown secret key "${key}". Declare it in SECRET_ENV_KEYS (cypress/support/secret-keys.ts) ` +
        `and add it to the relevant Cypress config's env block.`
    )
  }
  return store()[key] ?? ''
}
