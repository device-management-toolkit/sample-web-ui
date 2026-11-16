/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ErrorStateMatcher } from '@angular/material/core'

export const passwordConfirmationErrorState = (mismatch: () => boolean): ErrorStateMatcher => ({
  isErrorState: (control, form) =>
    control != null && (control.invalid || mismatch()) && (control.touched || form?.submitted === true)
})
