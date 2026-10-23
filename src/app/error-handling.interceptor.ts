import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { catchError, from, of, switchMap, throwError } from 'rxjs'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { environment } from '../environments/environment'

export const errorHandlingInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const dialog = inject(MatDialog)
  const snackbar = inject(MatSnackBar)
  const translate = inject(TranslateService)

  // IdP token request errors go to the library untouched: refreshing would
  // wait on itself, and a refused refresh must not log out twice.
  if (environment.useOAuth && authService.isOAuthTokenRequest(request.url)) {
    return next(request)
  }

  return next(request).pipe(
    // OAuth 401: refresh once and retry. The OAuth interceptor runs after this
    // one and attaches the new token. Errors of the retry reach the handler
    // below, so a second 401 logs out.
    catchError((error: any) =>
      environment.useOAuth && error instanceof HttpErrorResponse && error.status === 401
        ? from(authService.refreshAccessToken()).pipe(
            switchMap((refreshed) => (refreshed ? next(request) : throwError(() => error)))
          )
        : throwError(() => error)
    ),
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          if (error.error.exp === 'token expired') {
            dialog.open(DialogContentComponent, { data: { name: translate.instant('error.sessionTimedOut.value') } })
          }
          authService.logout()
        } else if (error.status === 412 || error.status === 409) {
          dialog.open(DialogContentComponent, {
            data: { name: translate.instant('error.itemModified.value') }
          })
        } else if (error.status === 504) {
          snackbar.open(
            translate.instant('error.deviceNotResponding.value'),
            translate.instant('common.dismiss.value'),
            {
              duration: 5000
            }
          )
          return of()
        }
      }
      return throwError(() => error)
    })
  )
}
