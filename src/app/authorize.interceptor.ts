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
import { tap } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
@Injectable()
export class AuthorizeInterceptor implements HttpInterceptor {
  constructor (public authService: AuthService, public dialog: MatDialog) { }

  intercept (request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.url.toString().includes('/authorize')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${this.authService.getLoggedUserToken()}`
        }
      })
    }
    return next.handle(request).pipe(
      tap(
        (data: any) => {
          if (data instanceof HttpResponse) {
            return data
          }
          return null
        },
        (error: any) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              this.authService.logout()
              if (error.error.exp === 'token expired') {
                this.dialog.open(DialogContentComponent, { data: { name: 'Session timed out. Please login again' } })
              }
            }
          }
          return throwError(error)
        }
      )
    )
  }
}
