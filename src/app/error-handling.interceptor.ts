import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { catchError, of, throwError } from 'rxjs'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

/** Keeps concurrent 401s from stacking a dialog each. */
const SESSION_TIMEOUT_DIALOG_ID = 'session-timed-out'

/** Login answers 401 on bad credentials; LoginComponent reports that itself. */
const isLoginRequest = (url: string): boolean => url.includes('/authorize') && !url.includes('/authorize/redirection')

export const errorHandlingInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const dialog = inject(MatDialog)
  const snackbar = inject(MatSnackBar)
  const translate = inject(TranslateService)

  return next(request).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && !isLoginRequest(request.url)) {
          // Backends word a dead token differently and the body is sometimes empty,
          // so the status drives the message.
          if (dialog.getDialogById(SESSION_TIMEOUT_DIALOG_ID) == null) {
            dialog.open(DialogContentComponent, {
              id: SESSION_TIMEOUT_DIALOG_ID,
              data: { name: translate.instant('error.sessionTimedOut.value') }
            })
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
