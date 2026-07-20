/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { inject } from '@angular/core'
import { HttpInterceptorFn } from '@angular/common/http'
import { AuthService } from './auth.service'
import { environment } from '../environments/environment'

export const authorizationInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)

  // Always send cookies with requests so the HttpOnly session cookie is
  // forwarded automatically for same-origin enterprise deployments.
  request = request.clone({ withCredentials: true })

  if (request.url.toString().includes('/authorize') && !request.url.toString().includes('/authorize/redirection')) {
    // Skip adding authorization headers for the login endpoint itself.
    return next(request)
  }

  const headers: any = {}

  // In cloud mode (MPS + RPS, cross-origin) the JWT lives in localStorage and
  // is sent as a Bearer header because cross-origin HttpOnly cookies require
  // SameSite=None + HTTPS, which is impractical for local development.
  //
  // In enterprise mode (same-origin Console) the JWT is in the HttpOnly session
  // cookie and is forwarded automatically via withCredentials above. No Bearer
  // header is needed, and Angular's built-in XSRF interceptor (configured in
  // main.ts) attaches X-XSRF-TOKEN for state-changing requests.
  if (environment.cloud) {
    const token = authService.getLoggedUserToken()

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  if ((request.body as any)?.version != null && (request.body as any)?.version !== '') {
    headers['if-match'] = (request.body as any).version
  }

  if (Object.keys(headers).length > 0) {
    request = request.clone({ setHeaders: headers })
  }

  return next(request)
}
