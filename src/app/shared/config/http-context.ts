/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpContextToken } from '@angular/common/http'

export const BACKGROUND_REQUEST = new HttpContextToken<boolean>(() => false)
