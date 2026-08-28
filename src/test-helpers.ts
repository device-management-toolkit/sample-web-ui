/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Vitest stand-ins for jasmine.createSpyObj / jasmine.SpyObj so the specs
// migrated from karma/jasmine keep their mock shape.

import { vi, type Mock } from 'vitest'

export type SpyObj<T> = T & {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] & Mock : T[K]
}

export const createSpyObj = <T = any>(
  baseName: string | string[] | Record<string, any>,
  methodNames?: string[] | Record<string, any>,
  properties?: string[] | Record<string, any>
): SpyObj<T> => {
  // jasmine allows the base name to be omitted: createSpyObj(['m']) / createSpyObj({ m: value })
  const methods = typeof baseName === 'string' ? methodNames : baseName
  const props = typeof baseName === 'string' ? properties : (methodNames as string[] | Record<string, any> | undefined)
  const obj: Record<string, any> = {}
  if (Array.isArray(methods)) {
    for (const method of methods) {
      obj[method] = vi.fn()
    }
  } else if (methods != null) {
    for (const [method, value] of Object.entries(methods)) {
      obj[method] = vi.fn().mockReturnValue(value)
    }
  }
  if (Array.isArray(props)) {
    for (const prop of props) {
      obj[prop] = undefined
    }
  } else if (props != null) {
    Object.assign(obj, props)
  }
  return obj as SpyObj<T>
}
