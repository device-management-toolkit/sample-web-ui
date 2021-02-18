/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { HttpClient } from '@angular/common/http'
import { EventEmitter, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedInSubject: EventEmitter<boolean> = new EventEmitter<boolean>(false)
  isLoggedIn = false
  url = `${environment.mpsServer}/authorize`
  constructor (private readonly http: HttpClient) {
    if (localStorage.loggedInUser) {
      this.isLoggedIn = true
      this.loggedInSubject.next(this.isLoggedIn)
    }
  }

  getMPSOptions (): object {
    return {
      headers: { 'X-MPS-API-Key': environment.mpsAPIKey },
      withCredentials: true
    }
  }

  getRPSOptions (): object {
    return {
      headers: { 'X-RPS-API-Key': environment.rpsAPIKey }

    }
  }

  login (username: string, password: string): Observable<any> {
    return this.http.post<any>(this.url, { username, password }, this.getMPSOptions())
      .pipe(
        map(() => {
          this.isLoggedIn = true
          this.loggedInSubject.next(this.isLoggedIn)
          localStorage.loggedInUser = JSON.stringify({ token: 'jwttoken' })
        }),
        catchError((err) => {
          throw err
        })
      )
  }

  logout (): void {
    this.isLoggedIn = false
    this.loggedInSubject.next(this.isLoggedIn)
    localStorage.loggedInUser = null
  }
}
