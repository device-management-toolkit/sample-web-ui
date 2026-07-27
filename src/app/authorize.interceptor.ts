/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { inject } from '@angular/core'
import { HttpInterceptorFn } from '@angular/common/http'
import { AuthService } from './auth.service'

export const authorizationInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const url = request.url.toString()
  const isLoginEndpoint = /\/(login\/)?api\/v1\/authorize$/.test(url)

  if (isLoginEndpoint) {
    // Login endpoint should not include bearer token.
    return next(request)
  }

  const headers: any = {
    Authorization: `Bearer ${authService.getLoggedUserToken()}`
  }

  if ((request.body as any)?.version != null && (request.body as any)?.version !== '') {
    headers['if-match'] = (request.body as any).version
  }

  request = request.clone({
    setHeaders: headers
  })

  return next(request)
}
