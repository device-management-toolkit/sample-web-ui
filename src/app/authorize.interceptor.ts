/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { inject, Injectable } from '@angular/core'
import { HttpErrorResponse, HttpResponse, HttpInterceptorFn } from '@angular/common/http'
import { throwError } from 'rxjs'
import { AuthService } from './auth.service'
import { catchError, tap } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
export const AuthorizeInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const dialog = inject(MatDialog)

  if (request.url.toString().includes('/authorize') && !request.url.toString().includes('/authorize/redirection')) {
    // don't send auth token
  } else {
    const headers: any = {
      Authorization: `Bearer ${authService.getLoggedUserToken()}`
    }
    if ((request.body as any)?.version != null && (request.body as any)?.version !== '') {
      headers['if-match'] = (request.body as any).version
    }
    request = request.clone({
      setHeaders: headers
    })
  }
  return next(request).pipe(
    tap((data: any) => {
      if (data instanceof HttpResponse) {
        return data
      }
      return null
    }),
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          if (error.error.exp === 'token expired') {
            authService.logout()
            dialog.open(DialogContentComponent, { data: { name: 'Session timed out. Please login again' } })
          }
        } else if (error.status === 412 || error.status === 409) {
          dialog.open(DialogContentComponent, {
            data: { name: 'This item has been modified since it has been loaded. Please reload.' }
          })
        }
      }
      return throwError(() => {
        return error
      })
    })
  )
}
