/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { MatSnackBarConfig } from '@angular/material/snack-bar'

interface SnackbarConfigs {
  defaultWarn: MatSnackBarConfig
  defaultError: MatSnackBarConfig
  longError: MatSnackBarConfig
  quickError: MatSnackBarConfig
  defaultSuccess: MatSnackBarConfig
  longSuccess: MatSnackBarConfig
  quickSuccess: MatSnackBarConfig
}
const SnackbarDefaults: SnackbarConfigs = {
  defaultWarn: { duration: 3000, panelClass: ['warn', 'mat-shadow-5'] },
  defaultError: { duration: 3000, panelClass: ['error', 'mat-shadow-5'] },
  longError: { duration: 10000, panelClass: ['error', 'mat-shadow-5'] },
  quickError: { duration: 1000, panelClass: ['error', 'mat-shadow-5'] },
  defaultSuccess: { duration: 3000, panelClass: ['success', 'mat-shadow-5'] },
  longSuccess: { duration: 10000, panelClass: ['success', 'mat-shadow-5'] },
  quickSuccess: { duration: 1000, panelClass: ['success', 'mat-shadow-5'] }
}

export default SnackbarDefaults
