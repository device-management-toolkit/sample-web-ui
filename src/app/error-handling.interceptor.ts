import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { catchError, of, throwError } from 'rxjs'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { inject } from '@angular/core'

export const errorHandlingInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService)
  const dialog = inject(MatDialog)
  const snackbar = inject(MatSnackBar)

  return next(request).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          if (error.error.exp === 'token expired') {
            dialog.open(DialogContentComponent, { data: { name: 'Session timed out. Please login again' } })
          }
          authService.logout()
        } else if (error.status === 412 || error.status === 409) {
          dialog.open(DialogContentComponent, {
            data: { name: 'This item has been modified since it has been loaded. Please reload.' }
          })
        } else if (error.status === 504) {
          snackbar.open('Device did not respond. Double check connection settings and try again.', 'Dismiss', {
            duration: 5000
          })
          return of()
        }
      }
      return throwError(() => error)
    })
  )
}
