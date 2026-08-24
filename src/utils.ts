/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Direction } from '@angular/cdk/bidi'
import { rtlLangs } from './constants'

export const caseInsensitiveCompare = (s1: string, s2: string): number => {
  return s1.localeCompare(s2)
}

export const getDirection = (langCode: string): Direction => {
  return rtlLangs.includes(langCode) ? 'rtl' : 'ltr'
}
