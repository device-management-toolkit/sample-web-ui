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
    // Cloud mode (MPS + RPS): JWT lives in localStorage, sent as Bearer header.
    // Enterprise mode (Console, same-origin): JWT is in an HttpOnly cookie set by
    // the server. We detect an active session by checking for the readable
    // XSRF-TOKEN cookie that is always paired with the session cookie.
    if (environment.cloud) {
      if (localStorage.loggedInUser != null) {
        this.isLoggedIn = true
        this.loggedInSubject$.next(this.isLoggedIn)
      }
    } else {
      if (this.hasValidCookieSession()) {
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

  // hasValidCookieSession returns true when the readable XSRF-TOKEN cookie is
  // present, indicating that the server has set an active HttpOnly session cookie.
  // The XSRF-TOKEN cookie is always created and expired together with the session
  // cookie, so its presence is a reliable proxy for session liveness.
  private hasValidCookieSession(): boolean {
    return document.cookie.split(';').some((c) => c.trim().startsWith('XSRF-TOKEN='))
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
      const token: string = JSON.parse(loggedInUser).token
      return token
    }
    return ''
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password }, { withCredentials: true }).pipe(
      map((data: any) => {
        if (!environment.useOAuth) {
          this.isLoggedIn = true
          // Cloud mode: store JWT in localStorage for Bearer-header auth.
          // Enterprise mode: the server set the HttpOnly session cookie in the
          // response — nothing to store client-side.
          if (environment.cloud) {
            localStorage.loggedInUser = JSON.stringify(data)
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
    this.isLoggedIn = false
    this.loggedInSubject$.next(this.isLoggedIn)
    localStorage.removeItem('loggedInUser')
    if (environment.useOAuth) {
      this.oauthService?.logOut()
    }
    // Enterprise mode: ask the server to expire the HttpOnly session cookie and
    // the XSRF-TOKEN cookie. Fire-and-forget — we navigate away regardless.
    if (!environment.cloud) {
      this.http
        .post(`${environment.mpsServer}/api/v1/logout`, {}, { withCredentials: true })
        .subscribe({ error: () => {} })
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
