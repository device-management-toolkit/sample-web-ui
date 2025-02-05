import { Injectable } from '@angular/core'
import { AuthService } from '../auth.service'
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { Observable, tap } from 'rxjs'

@Injectable()
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.canActivateProtectedRoutes$.pipe(
      tap((x) => {
        if (!x) {
          this.router.navigate(['/login'])
        }
      })
    )
  }
}
