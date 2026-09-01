/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { afterEach, vi } from 'vitest'

// jasmine automatically restored spies after every spec; vitest does not.
// Without this, specs that stub globals (document.createElement, FileReader,
// prototype methods, ...) leak their stubs into later specs.
afterEach(() => {
  vi.restoreAllMocks()
})
