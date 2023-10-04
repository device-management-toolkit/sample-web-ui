/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

export const caseInsensntiveCompare = (s1: string, s2: string): number => {
  return s1.localeCompare(s2)
}
