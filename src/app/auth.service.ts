/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { Router } from '@angular/router'
import { ValidatorError, MpsVersion, RpsVersion } from 'src/models/models'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  isLoggedIn = false
  url: string = `${environment.mpsServer}/api/v1/authorize`
  constructor (private readonly http: HttpClient, public router: Router) {
    if (localStorage.loggedInUser != null) {
      this.isLoggedIn = true
      this.loggedInSubject.next(this.isLoggedIn)
    }
    if (environment.mpsServer.includes('/mps')) { // handles kong route
      this.url = `${environment.mpsServer}/login/api/v1/authorize`
    }
  }

  getLoggedUserToken (): string {
    const loggedUser: any = localStorage.getItem('loggedInUser')
    const token: string = JSON.parse(loggedUser).token
    return token
  }

  login (username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password })
      .pipe(
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

  logout (): void {
    this.isLoggedIn = false
    this.loggedInSubject.next(this.isLoggedIn)
    localStorage.removeItem('loggedInUser')
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(['/login'])
  }

  getMPSVersion (): Observable<any> {
    return this.http.get<MpsVersion>(`${environment.mpsServer}/api/v1/version`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  getRPSVersion (): Observable<any> {
    return this.http.get<RpsVersion>(`${environment.rpsServer}/api/v1/admin/version`)
      .pipe(
        catchError((err) => {
          throw err
        })
      )
  }

  onError (err: any): string[] {
    const errorMessages: string[] = []
    if (err.error?.errors != null) {
      err.error.errors.forEach((error: ValidatorError) => {
        errorMessages.push(`${error.msg}: ${error.param}`)
      })
    } else if (err.error?.message != null) {
      errorMessages.push(err.error.message)
    } else {
      errorMessages.push(err)
    }
    return errorMessages
  }
}
