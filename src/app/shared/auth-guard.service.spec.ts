import { TestBed } from '@angular/core/testing'
import { AuthGuard } from './auth-guard.service'
import { AuthService } from '../auth.service'
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { of } from 'rxjs'

describe('AuthGuard', () => {
  let authGuard: AuthGuard
  let authService: jasmine.SpyObj<AuthService>
  let router: jasmine.SpyObj<Router>

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['canActivateProtectedRoutes$'])
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'])

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }]
    })

    authGuard = TestBed.inject(AuthGuard)
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>
  })

  it('should redirect to login if canActivateProtectedRoutes$ emits false', (done) => {
    authService.canActivateProtectedRoutes$ = of(false)

    authGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot).subscribe((result) => {
      expect(result).toBe(false)
      expect(router.navigate).toHaveBeenCalledWith(['/login'])
      done()
    })
  })

  it('should allow activation if canActivateProtectedRoutes$ emits true', (done) => {
    authService.canActivateProtectedRoutes$ = of(true)

    authGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot).subscribe((result) => {
      expect(result).toBe(true)
      expect(router.navigate).not.toHaveBeenCalled()
      done()
    })
  })
})
