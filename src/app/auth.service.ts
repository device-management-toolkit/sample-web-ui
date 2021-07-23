/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { HttpClient } from '@angular/common/http'
import { EventEmitter, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { Router } from '@angular/router'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedInSubject: EventEmitter<boolean> = new EventEmitter<boolean>(false)
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
          this.loggedInSubject.next(this.isLoggedIn)
          localStorage.loggedInUser = JSON.stringify(data)
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

  onError (err: any): string[] {
    const errorMessages: string[] = []
    if (err.error?.errors != null) {
      err.error.errors.forEach((error: any) => {
        errorMessages.push(error.msg)
      })
    } else if (err.error?.message != null) {
      errorMessages.push(err.error.message)
    } else {
      errorMessages.push(err)
    }
    return errorMessages
  }
}
