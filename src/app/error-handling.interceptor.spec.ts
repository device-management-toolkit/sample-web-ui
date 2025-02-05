import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { errorHandlingInterceptor } from './error-handling.interceptor'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'

describe('ErrorHandlingInterceptor', () => {
  let httpMock: HttpTestingController
  let httpClient: HttpClient
  let authService: jasmine.SpyObj<AuthService>
  let dialog: jasmine.SpyObj<MatDialog>
  let snackbar: jasmine.SpyObj<MatSnackBar>

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'])
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
    const snackbarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorHandlingInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackbarSpy }]
    })

    httpMock = TestBed.inject(HttpTestingController)
    httpClient = TestBed.inject(HttpClient)
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>
    snackbar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should handle 401 error and logout', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(authService.logout).toHaveBeenCalled()
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'Session timed out. Please login again' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({ exp: 'token expired' }, { status: 401, statusText: 'Unauthorized' })
  })

  it('should handle 412 error and show dialog', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'This item has been modified since it has been loaded. Please reload.' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 412, statusText: 'Precondition Failed' })
  })

  it('should handle 409 error and show dialog', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'This item has been modified since it has been loaded. Please reload.' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 409, statusText: 'Conflict' })
  })

  it('should handle 504 error and show snackbar', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(snackbar.open).toHaveBeenCalledWith(
          'Device did not respond. Double check connection settings and try again.',
          'Dismiss',
          {
            duration: 5000
          }
        )
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 504, statusText: 'Gateway Timeout' })
  })

  it('should rethrow other errors', () => {
    httpClient.get('/test').subscribe({
      error: (error) => {
        expect(error.status).toBe(500)
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 500, statusText: 'Internal Server Error' })
  })
})
