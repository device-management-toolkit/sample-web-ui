/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { beforeEach, describe, expect, it } from 'vitest'
import { createSpyObj, type SpyObj } from '../../test-helpers'
import { TestBed } from '@angular/core/testing'
import { AuthGuard } from './auth-guard.service'
import { AuthService } from '../auth.service'
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { of } from 'rxjs'

describe('AuthGuard', () => {
  let authGuard: AuthGuard
  let authService: SpyObj<AuthService>
  let router: SpyObj<Router>

  beforeEach(() => {
    const authServiceSpy = createSpyObj('AuthService', ['canActivateProtectedRoutes$'])
    const routerSpy = createSpyObj('Router', ['navigate'])

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })

    authGuard = TestBed.inject(AuthGuard)
    authService = TestBed.inject(AuthService) as SpyObj<AuthService>
    router = TestBed.inject(Router) as SpyObj<Router>
  })

  it('should redirect to login if canActivateProtectedRoutes$ emits false', async () => {
    await new Promise<void>((done) => {
      authService.canActivateProtectedRoutes$ = of(false)

      authGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot).subscribe((result) => {
        expect(result).toBe(false)
        expect(router.navigate).toHaveBeenCalledWith(['/login'])
        done()
      })
    })
  })

  it('should allow activation if canActivateProtectedRoutes$ emits true', async () => {
    await new Promise<void>((done) => {
      authService.canActivateProtectedRoutes$ = of(true)

      authGuard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot).subscribe((result) => {
        expect(result).toBe(true)
        expect(router.navigate).not.toHaveBeenCalled()
        done()
      })
    })
  })
})
