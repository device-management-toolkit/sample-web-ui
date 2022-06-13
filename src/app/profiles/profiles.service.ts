/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { PageEventOptions, Profile, ProfileResponse, TlsMode } from 'src/models/models'
import { AuthService } from '../auth.service'

@Injectable({
  providedIn: 'root'
})
export class ProfilesService {
  public tlsModes: TlsMode[] = [
    { viewValue: 'Server Authentication Only', value: 1 },
    { viewValue: 'Server & Non-TLS Authentication', value: 2 },
    { viewValue: 'Mutual TLS Authentication Only', value: 3 },
    { viewValue: 'Mutual and Non-TLS Authentication', value: 4 }
  ]

  private readonly url = `${environment.rpsServer}/api/v1/admin/profiles`
  constructor (private readonly authService: AuthService, private readonly http: HttpClient) {

  }

  getData (pageEvent?: PageEventOptions): Observable<ProfileResponse> {
    let query = this.url
    if (pageEvent) {
      query += `?$top=${pageEvent.pageSize}&$skip=${pageEvent.startsFrom}&$count=${pageEvent.count}`
    } else {
      query += '?$count=true'
    }
    return this.http.get<ProfileResponse>(query)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  getRecord (name: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.url}/${name}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  update (profile: Profile): Observable<Profile> {
    return this.http.patch<Profile>(this.url, profile)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  create (profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.url, profile)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }

  delete (name: string): Observable<any> {
    return this.http.delete(`${this.url}/${name}`)
      .pipe(
        catchError((err) => {
          const errorMessages = this.authService.onError(err)
          return throwError(errorMessages)
        })
      )
  }
}
