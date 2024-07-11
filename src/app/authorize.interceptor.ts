/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Injectable } from '@angular/core'
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { AuthService } from './auth.service'
import { catchError, tap } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
@Injectable()
export class AuthorizeInterceptor implements HttpInterceptor {
  constructor(
    public authService: AuthService,
    public dialog: MatDialog
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.toString().includes('/authorize') && !request.url.toString().includes('/authorize/redirection')) {
      // don't send auth token
    } else {
      const headers: any = {
        Authorization: `Bearer ${this.authService.getLoggedUserToken()}`
      }
      if (request.body?.version != null) {
        headers['if-match'] = request.body.version
      }
      request = request.clone({
        setHeaders: headers
      })
    }
    return next.handle(request).pipe(
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
              this.authService.logout()
              this.dialog.open(DialogContentComponent, { data: { name: 'Session timed out. Please login again' } })
            }
          } else if (error.status === 412 || error.status === 409) {
            this.dialog.open(DialogContentComponent, {
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
}
