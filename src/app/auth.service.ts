/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { Router } from '@angular/router'
import { ValidatorError, MPSVersion, RPSVersion } from 'src/models/models'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient)
  router = inject(Router)

  loggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  isLoggedIn = false
  url = `${environment.mpsServer}/api/v1/authorize`
  constructor() {
    if (localStorage.loggedInUser != null) {
      this.isLoggedIn = true
      this.loggedInSubject.next(this.isLoggedIn)
    }
    if (environment.mpsServer.includes('/mps')) {
      // handles kong route
      this.url = `${environment.mpsServer}/login/api/v1/authorize`
    }
  }

  getLoggedUserToken(): string {
    const loggedUser: string = localStorage.getItem('loggedInUser') ?? ''
    const token: string = JSON.parse(loggedUser).token
    return token
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password }).pipe(
      map((data: any) => {
        this.isLoggedIn = true
        localStorage.loggedInUser = JSON.stringify(data)
        this.loggedInSubject.next(this.isLoggedIn)
      }),
      catchError((err: any) => {
        throw err
      })
    )
  }

  logout(): void {
    this.isLoggedIn = false
    this.loggedInSubject.next(this.isLoggedIn)
    localStorage.removeItem('loggedInUser')

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
        errorMessages.push(`${error.msg}: ${error.param}`)
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
