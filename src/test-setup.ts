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

// Recent Node versions declare a `localStorage` global that stays undefined
// unless --localstorage-file is passed, and vitest only copies a DOM global
// onto globalThis when Node has not already claimed the name — so happy-dom's
// Storage never lands. Install our own rather than probing for the difference
// (reading Node's global emits an ExperimentalWarning per worker).
const store = new Map<string, string>()
const localStorageStub: Storage = {
  get length() {
    return store.size
  },
  clear: () => store.clear(),
  getItem: (key: string) => store.get(key) ?? null,
  key: (index: number) => [...store.keys()][index] ?? null,
  removeItem: (key: string) => {
    store.delete(key)
  },
  setItem: (key: string, value: string) => {
    store.set(key, String(value))
  }
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageStub, configurable: true })
