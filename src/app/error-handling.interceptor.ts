import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { catchError, of, throwError } from 'rxjs'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

// Polling requests set this to report transient gateway timeouts to the caller instead of notifying the user.
export const SUPPRESS_TRANSIENT_ERRORS = new HttpContextToken<boolean>(() => false)

export const errorHandlingInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const dialog = inject(MatDialog)
  const snackbar = inject(MatSnackBar)
  const translate = inject(TranslateService)

  return next(request).pipe(
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
        } else if (error.status === 504 && request.context.get(SUPPRESS_TRANSIENT_ERRORS)) {
          return throwError(() => error)
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
