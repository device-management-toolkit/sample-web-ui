import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { catchError, of, throwError } from 'rxjs'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

export const errorHandlingInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const dialog = inject(MatDialog)
  const snackbar = inject(MatSnackBar)
  const translate = inject(TranslateService)

  // Read when the request is sent: an earlier 401's logout() may clear it first.
  const sentWithSession = authService.isLoggedIn

  return next(request).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          // A 401 on a request sent with a session means it expired (console#993).
          // Console sends no exp field, so the flag decides. logout() clears it,
          // so parallel failures show the message once.
          if (authService.isLoggedIn || error.error?.exp === 'token expired') {
            dialog.open(DialogContentComponent, { data: { name: translate.instant('error.sessionTimedOut.value') } })
          }
          authService.logout()
          if (sentWithSession) {
            // The user is on their way to /login; the caller need not report it too.
            return of()
          }
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
