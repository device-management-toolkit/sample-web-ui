/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { inject } from '@angular/core'
import { HttpInterceptorFn } from '@angular/common/http'
import { environment } from '../environments/environment'
import { AuthService } from './auth.service'

export const authorizationInterceptor: HttpInterceptorFn = (request, next) => {
  // Kong only reads the Authorization header. The Console binary uses a cookie.
  const authService = environment.cloud ? inject(AuthService) : null

  if (
    authService != null &&
    request.url.toString().includes('/authorize') &&
    !request.url.toString().includes('/authorize/redirection')
  ) {
    // Skip adding authorization headers for specific routes
    return next(request)
  }

  const headers: any = {}

  if (authService != null) {
    const token = authService.getLoggedUserToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  if ((request.body as any)?.version != null && (request.body as any)?.version !== '') {
    headers['if-match'] = (request.body as any).version
  }

  request = request.clone({
    setHeaders: headers,
    // Lets the Console binary's session cookie travel cross-origin.
    withCredentials: !environment.cloud
  })

  return next(request)
}
