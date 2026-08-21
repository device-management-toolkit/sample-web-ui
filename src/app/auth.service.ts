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

// A UI hint, not a credential. The Console binary's session is an HttpOnly cookie.
const SESSION_FLAG = 'sessionActive'

// The session JWT. Cloud sends it; the Console binary purges it.
const TOKEN_KEY = 'loggedInUser'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient)
  private oauthService
  router = inject(Router)
  loggedInSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  public canActivateProtectedRoutes$: Observable<boolean> = combineLatest([
    this.loggedInSubject$
  ]).pipe(map((values) => values.every((b) => b)))

  isLoggedIn = false
  url = `${environment.mpsServer}/api/v1/authorize`

  constructor() {
    if (environment.useOAuth) {
      this.oauthService = inject(OAuthService)
    }
    // Match what login() writes, and only in the mode that writes it.
    if (environment.cloud) {
      if (!environment.useOAuth && this.getLoggedUserToken() !== '') {
        this.isLoggedIn = true
        this.loggedInSubject$.next(this.isLoggedIn)
      }
    } else {
      localStorage.removeItem(TOKEN_KEY)
      if (!environment.useOAuth && localStorage.getItem(SESSION_FLAG) === 'true') {
        this.isLoggedIn = true
        this.loggedInSubject$.next(this.isLoggedIn)
      }
    }
    if (environment.mpsServer.includes('/mps')) {
      // handles kong route
      this.url = `${environment.mpsServer}/login/api/v1/authorize`
    }
    if (environment.useOAuth && this.oauthService != null) {
      this.oauthService.events.subscribe(() => {
        this.loggedInSubject$.next(this.oauthService!.hasValidAccessToken())
      })

      this.loggedInSubject$.next(this.oauthService.hasValidAccessToken())

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
    const loggedInUser: string = localStorage.getItem(TOKEN_KEY) ?? ''
    if (loggedInUser === '') {
      return ''
    }
    try {
      // The constructor calls this, so a corrupt value must not throw.
      return JSON.parse(loggedInUser).token ?? ''
    } catch {
      return ''
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password }).pipe(
      map((data: any) => {
        if (!environment.useOAuth) {
          this.isLoggedIn = true
          if (environment.cloud) {
            // Kong verifies the JWT, so keep a copy to send.
            localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
          } else {
            // The body token is for REST clients; the browser uses the cookie.
            localStorage.setItem(SESSION_FLAG, 'true')
          }
          this.loggedInSubject$.next(this.isLoggedIn)
        }
        return data
      }),
      catchError((err: any) => {
        throw err
      })
    )
  }

  logout(): void {
    const hadSession = this.isLoggedIn

    this.isLoggedIn = false
    this.loggedInSubject$.next(this.isLoggedIn)
    localStorage.removeItem(SESSION_FLAG)
    localStorage.removeItem(TOKEN_KEY)

    if (environment.useOAuth) {
      this.oauthService?.logOut()
    } else if (!environment.cloud && hadSession) {
      // Only the server can expire an HttpOnly cookie. MPS has no such route.
      this.http.post(`${this.url}/logout`, {}).subscribe({ error: () => undefined })
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
