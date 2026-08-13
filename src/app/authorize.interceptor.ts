/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpInterceptorFn } from '@angular/common/http'

export const authorizationInterceptor: HttpInterceptorFn = (request, next) => {
  const headers: any = {}

  if ((request.body as any)?.version != null && (request.body as any)?.version !== '') {
    headers['if-match'] = (request.body as any).version
  }

  // No token to attach: the session is an HttpOnly cookie. withCredentials lets
  // the browser store and send it across origins, login request included.
  request = request.clone({
    setHeaders: headers,
    withCredentials: true
  })

  return next(request)
}
