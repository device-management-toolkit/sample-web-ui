import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { AuthService } from './auth.service'
import { errorHandlingInterceptor } from './error-handling.interceptor'
import { DialogContentComponent } from './shared/dialog-content/dialog-content.component'
import { provideTranslateService } from '@ngx-translate/core'

describe('ErrorHandlingInterceptor', () => {
  let httpMock: HttpTestingController
  let httpClient: HttpClient
  let authService: jasmine.SpyObj<AuthService>
  let dialog: jasmine.SpyObj<MatDialog>
  let snackbar: jasmine.SpyObj<MatSnackBar>

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'])
    const dialogSpy = jasmine.createSpyObj('MatDialog', [
      'open',
      'getDialogById'
    ])
    const snackbarSpy = jasmine.createSpyObj('MatSnackBar', ['open'])

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideHttpClient(withInterceptors([errorHandlingInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackbarSpy }
      ]
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
          id: 'session-timed-out',
          data: { name: 'error.sessionTimedOut.value' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({ exp: 'token expired' }, { status: 401, statusText: 'Unauthorized' })
  })

  it('should report a session timeout for a 401 that does not describe the token', () => {
    // Console's wording for an expired token
    httpClient.get('/test').subscribe({
      error: () => {
        expect(authService.logout).toHaveBeenCalled()
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          id: 'session-timed-out',
          data: { name: 'error.sessionTimedOut.value' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({ error: 'invalid access token' }, { status: 401, statusText: 'Unauthorized' })
  })

  it('should report a session timeout for a 401 with an empty body', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(authService.logout).toHaveBeenCalled()
        expect(dialog.open).toHaveBeenCalledTimes(1)
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush(null, { status: 401, statusText: 'Unauthorized' })
  })

  it('should leave a failed login to the login page', () => {
    httpClient.post('http://localhost:3000/api/v1/authorize', {}).subscribe({
      error: (error) => {
        expect(error.status).toBe(401)
        expect(dialog.open).not.toHaveBeenCalled()
        expect(authService.logout).not.toHaveBeenCalled()
      }
    })

    const req = httpMock.expectOne('http://localhost:3000/api/v1/authorize')
    req.flush({ message: 'Incorrect Username and/or Password!' }, { status: 401, statusText: 'Unauthorized' })
  })

  it('should open a single session timeout dialog for concurrent 401s', () => {
    dialog.open.and.callFake(() => {
      dialog.getDialogById.and.returnValue({} as any)
      return {} as any
    })

    httpClient.get('/one').subscribe({ error: () => undefined })
    httpClient.get('/two').subscribe({ error: () => undefined })

    httpMock.expectOne('/one').flush(null, { status: 401, statusText: 'Unauthorized' })
    httpMock.expectOne('/two').flush(null, { status: 401, statusText: 'Unauthorized' })

    expect(dialog.open).toHaveBeenCalledTimes(1)
  })

  it('should handle 412 error and show dialog', () => {
    httpClient.get('/test').subscribe({
      error: () => {
        expect(dialog.open).toHaveBeenCalledWith(DialogContentComponent, {
          data: { name: 'error.itemModified.value' }
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
          data: { name: 'error.itemModified.value' }
        })
      }
    })

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 409, statusText: 'Conflict' })
  })

  it('should handle 504 error and show snackbar', () => {
    httpClient.get('/test').subscribe()

    const req = httpMock.expectOne('/test')
    req.flush({}, { status: 504, statusText: 'Gateway Timeout' })

    expect(snackbar.open).toHaveBeenCalledOnceWith(jasmine.any(String), jasmine.any(String), { duration: 5000 })
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
