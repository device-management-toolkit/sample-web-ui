/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { BehaviorSubject, combineLatest, Observable } from 'rxjs'
import { catchError, filter, map } from 'rxjs/operators'
import { environment } from '../environments/environment'
import { Router } from '@angular/router'
import { ValidatorError, MPSVersion, RPSVersion } from '../models/models'
import { OAuthService } from 'angular-oauth2-oidc'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Clock skew tolerance for distributed systems
  // Allows 5 minutes for clock differences between client, edge nodes, and backend
  // This handles timezone/NTP drift without allowing truly expired tokens through
  private static readonly clockSkewToleranceMs = 5 * 60 * 1000
  private readonly http = inject(HttpClient)
  private oauthService
  router = inject(Router)
  loggedInSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  private authStateInitialized$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  public canActivateProtectedRoutes$: Observable<boolean> = combineLatest([
    this.loggedInSubject$,
    this.authStateInitialized$
  ]).pipe(
    filter(([, initialized]) => initialized),
    map(([isLoggedIn]) => isLoggedIn)
  )

  isLoggedIn = false
  url = `${environment.mpsServer}/api/v1/authorize`

  constructor() {
    if (environment.useOAuth) {
      this.oauthService = inject(OAuthService)
    }
    // Only restore from localStorage for JWT-based auth, not OAuth
    if (!environment.useOAuth) {
      if (localStorage.getItem('loggedInUser') != null) {
        this.restoreSessionFromStorage()
      } else {
        this.authStateInitialized$.next(true)
      }
    }
    // OAuth initialization happens below after access token validity is checked
    if (environment.mpsServer.includes('/mps')) {
      // handles kong route
      this.url = `${environment.mpsServer}/login/api/v1/authorize`
    }
    if (environment.useOAuth && this.oauthService != null) {
      this.oauthService.events.subscribe(() => {
        this.loggedInSubject$.next(this.oauthService!.hasValidAccessToken())
      })

      this.loggedInSubject$.next(this.oauthService.hasValidAccessToken())
      this.authStateInitialized$.next(true)

      this.oauthService.events
        .pipe(filter((e) => ['session_terminated', 'session_error'].includes(e.type)))
        .subscribe(() => this.logout())
    }
  }

  public runInitialLoginSequence(): Promise<void> {
    if (location.hash) {
      console.log('Encountered hash fragment, plotting as table...')
      console.table(
        location.hash
          .substr(1)
          .split('&')
          .map((kvp) => kvp.split('='))
      )
    }
    return this.oauthService!.loadDiscoveryDocument()
      .then(() => this.oauthService!.tryLogin())
      .then(() => {
        if (this.oauthService!.hasValidAccessToken()) {
          return Promise.resolve()
        }

        return this.oauthService!.silentRefresh()
          .then(() => Promise.resolve())
          .catch((result) => {
            const errorResponsesRequiringUserInteraction = [
              'interaction_required',
              'login_required',
              'account_selection_required',
              'consent_required'
            ]

            // wait for user to login manually
            if (result && result.reason && errorResponsesRequiringUserInteraction.indexOf(result.reason.error) >= 0) {
              return Promise.resolve()
            }

            // Welp, couldn't log in
            return Promise.reject(result)
          })
      })
      .then(() => {
        if (
          this.oauthService!.state &&
          this.oauthService!.state !== 'undefined' &&
          this.oauthService!.state !== 'null'
        ) {
          let stateUrl = this.oauthService!.state
          if (stateUrl.startsWith('/') === false) {
            stateUrl = decodeURIComponent(stateUrl)
          }
          console.log(`There was state of ${this.oauthService!.state}, so we are sending you to: ${stateUrl}`)
          this.router.navigateByUrl(stateUrl)
        }
      })
  }

  getLoggedUserToken(): string {
    const loggedInUser: string = localStorage.getItem('loggedInUser') ?? ''
    if (loggedInUser !== '') {
      try {
        const token: string = JSON.parse(loggedInUser).token
        return token
      } catch {
        // Corrupted localStorage - clear it to allow app recovery
        localStorage.removeItem('loggedInUser')
        return ''
      }
    }
    return ''
  }

  private restoreSessionFromStorage(): void {
    const token = this.getLoggedUserToken()
    if (!token) {
      this.clearSessionAndMarkInitialized()
      return
    }

    // Validate token client-side
    if (!this.isTokenValidClientSide(token)) {
      this.clearSessionAndMarkInitialized()
      return
    }

    // Token is valid client-side, allow login but mark for validation
    // The first API call will verify if the token is actually valid server-side
    // If it gets a 401, the error interceptor will handle logout
    this.isLoggedIn = true
    this.loggedInSubject$.next(true)
    this.authStateInitialized$.next(true)
  }

  private isTokenValidClientSide(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1]
      if (!payloadPart) {
        return false
      }

      const payload = JSON.parse(this.decodeBase64Url(payloadPart)) as { exp?: number }
      if (typeof payload.exp !== 'number') {
        return false
      }

      // Check if token is expired, with tolerance for clock skew
      // In distributed systems, client/edge/backend clocks may differ
      // Allow tokens that expired within the last 5 minutes (clock skew tolerance)
      // but reject anything older than that
      const expirationMs = payload.exp * 1000
      const now = Date.now()

      // Token is valid if: expiration time + tolerance > current time
      // This means tokens expired >5 minutes ago are rejected
      return expirationMs + AuthService.clockSkewToleranceMs > now
    } catch {
      return false
    }
  }

  private clearSession(): void {
    localStorage.removeItem('loggedInUser')
    this.isLoggedIn = false
    this.loggedInSubject$.next(false)
  }

  private clearSessionAndMarkInitialized(): void {
    this.clearSession()
    this.authStateInitialized$.next(true)
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return atob(padded)
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password }).pipe(
      map((data: any) => {
        if (!environment.useOAuth) {
          this.isLoggedIn = true
          localStorage.loggedInUser = JSON.stringify(data)
          this.loggedInSubject$.next(this.isLoggedIn)
          this.authStateInitialized$.next(true)
        }
        return data
      }),
      catchError((err: any) => {
        throw err
      })
    )
  }

  logout(): void {
    this.isLoggedIn = false
    this.loggedInSubject$.next(this.isLoggedIn)
    this.authStateInitialized$.next(true)
    localStorage.removeItem('loggedInUser')
    if (environment.useOAuth) {
      this.oauthService?.logOut()
    }
    this.router.navigate(['/login'])
  }

  getMPSVersion(): Observable<any> {
    return this.http.get<MPSVersion>(`${environment.mpsServer}/api/v1/version`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getRPSVersion(): Observable<any> {
    return this.http.get<RPSVersion>(`${environment.rpsServer}/api/v1/admin/version`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  getConsoleVersion(): Observable<any> {
    return this.http.get<RPSVersion>(`${environment.rpsServer}/version`).pipe(
      catchError((err) => {
        throw err
      })
    )
  }

  onError(err: any): string[] {
    const errorMessages: string[] = []
    if (err.error?.errors != null) {
      err.error.errors.forEach((error: ValidatorError) => {
        errorMessages.push(error.msg)
      })
    } else if (err.error?.message != null) {
      errorMessages.push(err.error.message as string)
    } else {
      errorMessages.push(err as string)
    }
    return errorMessages
  }

  compareSemver(current: string, latest: string): number {
    const parseVersion = (version: string): number[] => {
      return version.replace('v', '').split('.').map(Number)
    }

    const [
      currentMajor,
      currentMinor,
      currentPatch
    ] = parseVersion(current)
    const [
      latestMajor,
      latestMinor,
      latestPatch
    ] = parseVersion(latest)

    if (currentMajor !== latestMajor) {
      return currentMajor - latestMajor
    }

    if (currentMinor !== latestMinor) {
      return currentMinor - latestMinor
    }

    return currentPatch - latestPatch
  }
}
