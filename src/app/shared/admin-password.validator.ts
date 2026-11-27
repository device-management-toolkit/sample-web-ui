/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ValidationErrors, ValidatorFn } from '@angular/forms'

// Mirrors Console's administrator password policy (pkg/secrets.IsStrongAdminPassword):
// at least 8 characters with a lowercase letter, an uppercase letter, a digit, and a symbol.
const requiredClasses = [
  /[a-z]/,
  /[A-Z]/,
  /\d/,
  /[^a-zA-Z0-9]/
]

export const adminPasswordValidator: ValidatorFn = (control): ValidationErrors | null => {
  const password = String(control.value ?? '')
  const strong = Array.from(password).length >= 8 && requiredClasses.every((pattern) => pattern.test(password))
  return strong ? null : { weakPassword: true }
}
