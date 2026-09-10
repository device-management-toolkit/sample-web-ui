/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Import commands.js using ES2015 syntax:
import './commands'
import { loadSecrets } from './secrets'

// Credentials are withheld from "expose", so pull them out of "env" once per
// spec here — secret() is synchronous and needs them before any test runs.
before(() => {
  loadSecrets()
})
